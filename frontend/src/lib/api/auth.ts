import type { Session } from "@supabase/supabase-js"
import { supabase } from "../supabase"
import { normalizeError } from "../errors"

/**
 * Auth goes straight through the Supabase Auth SDK (§2.4) — there is no
 * custom Edge Function for signup/login, and none is needed: the
 * `handle_new_auth_user` trigger (migration 0005) creates the matching
 * `public.users` profile row synchronously on signup, atomically, inside the
 * database itself.
 */

export async function signUp(
  email: string,
  password: string,
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw normalizeError(error)
  return data.session
}

export async function signIn(
  email: string,
  password: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw normalizeError(error)
  return data.session
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  })
  if (error) throw normalizeError(error)
  // No return value: signInWithOAuth redirects the browser away immediately
  // on success, so there's nothing to hand back to the caller.
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw normalizeError(error)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  })
  if (error) throw normalizeError(error)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw normalizeError(error)
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: "signup", email })
  if (error) throw normalizeError(error)
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
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
