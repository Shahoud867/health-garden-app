import type { Session } from "@supabase/supabase-js"
import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { withTimeout, QUERY_TIMEOUT_MS } from "../timeout"

/**
 * Auth goes straight through the Supabase Auth SDK (§2.4) — there is no
 * custom Edge Function for signup/login, and none is needed: the
 * `handle_new_auth_user` trigger (migration 0005) creates the matching
 * `public.users` profile row synchronously on signup, atomically, inside the
 * database itself.
 *
 * Every call here is wrapped in `withTimeout` too (see lib/timeout.ts) — a
 * stalled signup/login request is just as capable of stranding a user on a
 * disabled submit button forever as a stalled table query is.
 */

export async function signUp(
  email: string,
  password: string,
): Promise<Session | null> {
  const { data, error } = await withTimeout(
    supabase.auth.signUp({ email, password }),
    QUERY_TIMEOUT_MS,
    "Could not create your account — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return data.session
}

export async function signIn(
  email: string,
  password: string,
): Promise<Session> {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    QUERY_TIMEOUT_MS,
    "Could not sign you in — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return data.session
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    }),
    QUERY_TIMEOUT_MS,
    "Could not sign you in — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  // No return value: signInWithOAuth redirects the browser away immediately
  // on success, so there's nothing to hand back to the caller.
}

export async function signOut(): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.signOut(),
    QUERY_TIMEOUT_MS,
    "Could not sign you out — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    }),
    QUERY_TIMEOUT_MS,
    "Could not send the reset email — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.updateUser({ password: newPassword }),
    QUERY_TIMEOUT_MS,
    "Could not update your password — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.resend({ type: "signup", email }),
    QUERY_TIMEOUT_MS,
    "Could not resend the confirmation email — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    QUERY_TIMEOUT_MS,
    "Could not load your session — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return data.session
}

/** Thin re-export so screens/hooks never import `supabase` directly for auth state. */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => subscription.unsubscribe()
}
