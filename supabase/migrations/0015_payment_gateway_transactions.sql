-- Real-time payment gateway transactions (Blueprint ADR-008's "real-API
-- path", finally implemented -- see ADR-0028 for the JazzCash integration
-- this table backs). Deliberately a new table, not an extension of
-- `payment_intents`: that table's own doc comment (migration 0006) already
-- names it as "the interim bridge... until a real merchant API exists" with
-- a human-review state machine (pending_review/approved/rejected) built
-- around a founder's judgement call. A real gateway transaction has none of
-- that -- JazzCash itself gives a definitive, cryptographically verifiable
-- answer -- so forcing it through the manual table's states would mean
-- either lying about which ones apply or bolting gateway-specific columns
-- onto a table whose whole reason to exist is the absence of a gateway.
--
-- subscriptions.provider already had 'jazzcash' as a valid CHECK value
-- (migration 0006, written ahead of this ever being built) -- activation on
-- a completed transaction reuses that column and payments-approve-intent's
-- exact activation shape, not a new one.
CREATE TABLE payment_gateway_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL CHECK (provider IN ('jazzcash')),
  -- JazzCash's pp_TxnRefNo -- generated server-side, unique per checkout
  -- attempt, and how the webhook callback is matched back to this row.
  txn_ref_no VARCHAR(50) NOT NULL UNIQUE,
  amount_pkr INT NOT NULL CHECK (amount_pkr > 0),
  -- 'verification_failed' is deliberately distinct from 'failed': the
  -- latter is JazzCash's own definitive decline; the former means the
  -- callback's pp_SecureHash didn't match what we computed -- fails closed
  -- (never activates a subscription) without conflating "the bank said no"
  -- with "we couldn't trust this response enough to say either way."
  status VARCHAR(20) NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'completed', 'failed', 'verification_failed')),
  provider_response_code VARCHAR(10),
  provider_response_message VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX idx_payment_gateway_txns_user ON payment_gateway_transactions (user_id);
CREATE INDEX idx_payment_gateway_txns_status ON payment_gateway_transactions (status);

ALTER TABLE payment_gateway_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT-only, same reasoning as payment_intents/subscriptions (migration
-- 0006): real payment state must never be directly writable by a user's own
-- client. Rows are created by payments-jazzcash-create and updated by
-- payments-jazzcash-webhook, both via the service-role client.
CREATE POLICY "Users read own gateway transactions" ON payment_gateway_transactions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
