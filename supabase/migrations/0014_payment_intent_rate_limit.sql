-- Closes a race condition found during the Phase 8 security review:
-- payments-submit-intent's rate limit (max 3 pending submissions/24h,
-- ADR-008/§7.12) was a separate SELECT-count-then-INSERT in application
-- code. Two concurrent submissions from the same user could each read
-- "still under the limit" before either committed, bypassing the cap --
-- exactly the class of race `increment_daily_ai_usage` (migration 0010,
-- ADR-003) already closed for the AI usage cap, and `sync_garden_state`
-- (migration 0005) closed for board-slot assignment. Same fix here: the
-- check and the write happen inside one SECURITY DEFINER function, with a
-- row lock serializing concurrent callers for the same user.
--
-- Lower stakes than the AI cap (exceeding it briefly adds a few extra rows
-- to a manual review queue, not unauthorized spend), but cheap enough to
-- close properly rather than leave as a known gap.

CREATE OR REPLACE FUNCTION submit_payment_intent_if_under_limit(
  p_user_id UUID,
  p_amount_pkr INT,
  p_method VARCHAR,
  p_reference VARCHAR,
  p_max_pending INT DEFAULT 3
) RETURNS BIGINT AS $$
DECLARE
  v_recent_count INT;
  v_new_id BIGINT;
BEGIN
  -- Serializes concurrent calls for the same user -- the same row-locking
  -- pattern sync_garden_state uses for the identical class of race, applied
  -- here to the user's own row rather than re-deriving a separate lock
  -- mechanism.
  PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

  SELECT COUNT(*) INTO v_recent_count FROM payment_intents
    WHERE user_id = p_user_id
      AND status = 'pending_review'
      AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_recent_count >= p_max_pending THEN
    RETURN NULL; -- caller distinguishes "rate limited" from "inserted" by NULL, not an exception
  END IF;

  INSERT INTO payment_intents (user_id, amount_pkr, method, user_submitted_reference)
  VALUES (p_user_id, p_amount_pkr, p_method, p_reference)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Called via the service-role client from payments-submit-intent's handler,
-- the same posture as every other atomic-write RPC in this codebase
-- (ADR-0024) -- the handler itself still resolves "who is asking" from the
-- caller's own authenticated session before ever reaching this function, so
-- moving the write off the user-scoped/RLS-enforced client does not weaken
-- who can submit on whose behalf, only how the rate-limit race is closed.
REVOKE EXECUTE ON FUNCTION submit_payment_intent_if_under_limit(UUID, INT, VARCHAR, VARCHAR, INT)
  FROM PUBLIC, anon, authenticated;
