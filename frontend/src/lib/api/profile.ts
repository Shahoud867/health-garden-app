import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import type { UserProfileUpdate, UserRow } from "../database.types"

/**
 * Direct PostgREST access (§6.1) — no Edge Function needed. RLS (0003_users.sql)
 * already scopes every query to `auth.uid() = auth_id`; the explicit
 * `.eq('auth_id', authId)` below is belt-and-suspenders clarity, not what
 * makes this safe.
 */

export async function getProfile(authId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle()

  if (error) throw normalizeError(error)
  return data as UserRow | null
}

export async function updateProfile(
  authId: string,
  patch: UserProfileUpdate,
): Promise<UserRow> {
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("auth_id", authId)
    .select("*")
    .single()

  if (error) throw normalizeError(error)
  return data as UserRow
}
