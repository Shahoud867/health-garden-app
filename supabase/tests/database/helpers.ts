/**
 * Shared test utilities for the database-layer suite (Blueprint §13.5 —
 * Vitest, not pgTAP, is the specified tool for testing the garden
 * derivation functions).
 *
 * Two access paths, deliberately:
 * - `newPgClient()` — a direct Postgres connection, run as the local
 *   superuser. Used for white-box assertions that must bypass both RLS and
 *   the RPC-privilege lockdown (ADR-0024) — neither of which a black-box,
 *   PostgREST-facing test should be able to bypass itself.
 * - `createTestUser()` — a real signed-up user via GoTrue, returning a
 *   JWT-scoped `supabase-js` client. Used for RLS/API-surface assertions,
 *   exercising the exact interface a real client uses.
 *
 * Connection details come from environment variables populated by
 * `supabase status -o env` (see .github/workflows/ci.yml's `database` job
 * and README's local dev instructions) — never hardcoded, per this
 * project's secrets-hygiene convention (.env.example).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `Missing required env var (tried: ${names.join(', ')}). Run \`supabase start\`, then ` +
      '`supabase status -o env` and export its output before running `npm run test:db`.',
  );
}

// `supabase status -o env` names these API_URL/ANON_KEY/SERVICE_ROLE_KEY/DB_URL; the
// SUPABASE_-prefixed names match .env.example for local developer convenience. Both are
// accepted so this suite works whichever way the values were exported.
export const SUPABASE_URL = requireEnv('SUPABASE_URL', 'API_URL');
export const ANON_KEY = requireEnv('SUPABASE_ANON_KEY', 'ANON_KEY');
export const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY');
export const DATABASE_URL = requireEnv('DATABASE_URL', 'DB_URL');

export const serviceRoleClient: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** A fresh direct Postgres connection. Caller is responsible for `.connect()`/`.end()`. */
export function newPgClient(): pg.Client {
  return new pg.Client({ connectionString: DATABASE_URL });
}

let testUserCounter = 0;

export interface TestUser {
  client: SupabaseClient;
  authId: string;
  userId: string;
  email: string;
}

/**
 * Signs up a brand-new real user via GoTrue and returns a JWT-scoped client for them, alongside
 * the public.users.id that handle_new_auth_user (migration 0005) creates synchronously.
 *
 * Local auth.email.enable_confirmations = false (config.toml), so the session is active
 * immediately — no confirmation-link step needed.
 */
export async function createTestUser(): Promise<TestUser> {
  testUserCounter += 1;
  const email = `db-test-${Date.now()}-${testUserCounter}@example.test`;
  const password = 'Test-password-1234!';

  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user) {
    throw new Error(`Failed to sign up test user ${email}: ${error?.message}`);
  }

  const { data: profile, error: profileError } = await serviceRoleClient
    .from('users')
    .select('id')
    .eq('auth_id', data.user.id)
    .single();
  if (profileError || !profile) {
    throw new Error(
      `handle_new_auth_user did not create a profile row for ${email}: ${profileError?.message}`,
    );
  }

  return { client, authId: data.user.id, userId: (profile as { id: string }).id, email };
}

/** Deletes a test user via the admin API — cascades through every table (migration 0003's
 * auth_id FK, and every other table's own ON DELETE CASCADE on user_id). */
export async function deleteTestUser(user: TestUser): Promise<void> {
  await serviceRoleClient.auth.admin.deleteUser(user.authId);
}
