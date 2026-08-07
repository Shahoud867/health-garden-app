import { createClient } from "@supabase/supabase-js"
import { env } from "./env"

/**
 * Single shared Supabase client for the whole app. `persistSession: true`
 * (the default) keeps the session in `localStorage` and `autoRefreshToken`
 * keeps the JWT fresh in the background — every `supabase.from(...)` /
 * `supabase.functions.invoke(...)` call downstream automatically carries the
 * current user's auth, and RLS on the database does the actual authorization
 * (§7.3 of the blueprint — never re-implemented client-side).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
