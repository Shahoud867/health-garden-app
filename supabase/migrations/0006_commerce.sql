-- Commerce — subscriptions and the interim manual-verification path (§5.2,
-- ADR-008).

CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL
    CHECK (provider IN ('jazzcash', 'easypaisa', 'card', 'manual_interim')),
  provider_reference VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  amount_pkr INT NOT NULL CHECK (amount_pkr > 0),
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL CHECK (current_period_end >= current_period_start),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user ON subscriptions (user_id);

-- Bridges the SECP/merchant-account gap (G-3) until a real merchant API
-- exists. User pays manually (JazzCash/Easypaisa personal transfer), submits
-- the transaction reference; a founder verifies and approves via Retool.
CREATE TABLE payment_intents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount_pkr INT NOT NULL CHECK (amount_pkr > 0),
  method VARCHAR(30) NOT NULL CHECK (method IN ('jazzcash_manual', 'easypaisa_manual')),
  user_submitted_reference VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_intents_status ON payment_intents (status);
CREATE INDEX idx_payment_intents_user ON payment_intents (user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- SELECT-only: real billing state must never be directly writable by a
-- user's own client — a client that could INSERT/UPDATE its own row could
-- simply grant itself premium. Writes happen exclusively via the
-- service-role client inside payments-approve-intent / payments-webhook
-- (§6.2, ADR-008), which is what the trigger below also relies on.
CREATE POLICY "Users read own subscriptions" ON subscriptions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- A user may create and read their own submission (the interim
-- manual-verification flow), but never transition its own status —
-- approval/rejection is a founder action via Retool using the service-role
-- client, never the submitting user's own client.
CREATE POLICY "Users read own payment intents" ON payment_intents
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users submit own payment intents" ON payment_intents
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND status = 'pending_review'
  );

-- users.is_premium is trigger-maintained (§5.5), never an independently
-- writable column.
CREATE OR REPLACE FUNCTION sync_is_premium() RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET is_premium = EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = NEW.user_id AND status = 'active' AND current_period_end >= CURRENT_DATE
  ) WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_subscription_premium_sync
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION sync_is_premium();

-- Closes the same class of gap the garden_state/permanent_garden RLS fix
-- (migration 0005) closes: users RLS (migration 0003) lets a user UPDATE
-- their own row, and RLS is row-level, not column-level — it cannot by
-- itself stop a client PATCH from setting is_premium directly. This BEFORE
-- trigger recomputes and overwrites is_premium on every insert/update of a
-- users row, unconditionally discarding whatever value the client sent, so
-- §5.5's "derived, not independently writable" guarantee holds even against
-- a client updating its own row (not just other users' rows, which the
-- trigger above already covers via the subscriptions path).
CREATE OR REPLACE FUNCTION enforce_is_premium_derivation() RETURNS TRIGGER AS $$
BEGIN
  NEW.is_premium := EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = NEW.id AND status = 'active' AND current_period_end >= CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_is_premium_derivation
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION enforce_is_premium_derivation();
