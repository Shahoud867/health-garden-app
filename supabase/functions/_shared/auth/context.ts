/**
 * Authentication context resolution (Blueprint §4.5, §7.1, ADR-006).
 *
 * Authorization in this system is layered, and this module is only the second
 * of three layers. Understanding the split matters before changing anything here:
 *
 *   Layer 1 — Platform gateway. `verify_jwt = true` in config.toml rejects
 *             unauthenticated calls before the isolate boots. Cheapest gate.
 *
 *   Layer 2 — This module. Resolves the caller's identity so handlers can make
 *             business decisions (entitlements, caps) that RLS cannot express.
 *
 *   Layer 3 — Row Level Security. The authoritative access control. Every query
 *             issued on the caller's behalf is constrained by policy inside
 *             Postgres, so a bug in layers 1–2 cannot expose another user's row.
 *
 * The consequence for implementers: never use the service-role client to satisfy
 * a user-facing read. Doing so silently removes layer 3 — the only layer that a
 * compromised or modified client cannot bypass.
 *
 * Credential transport (Blueprint §4.5, ADR-020): the web client sends the
 * session as a bearer token extracted from its httpOnly cookie by Next.js
 * server-side code before the request reaches an Edge Function — the cookie
 * itself never crosses this boundary. This module only ever sees a bearer
 * token, regardless of which client (web now, mobile later per ADR-005) or
 * cookie mechanism produced it.
 */

import { createClient, type SupabaseClient, type User } from '../deps.ts';
import type { AppConfig } from '../config/env.ts';
import { Errors } from '../http/errors.ts';

/** The authenticated caller and a client scoped to their identity. */
export interface AuthContext {
  /** `auth.users.id` — matches `users.auth_id` in the application schema. */
  readonly authId: string;
  readonly user: User;
  /**
   * Supabase client carrying the caller's JWT.
   *
   * Every query through this client is subject to RLS. This is the correct
   * client for all user-facing data access.
   */
  readonly db: SupabaseClient;
}

const BEARER_PREFIX = 'bearer ';

/** Extracts a bearer token from an Authorization header value. */
export function extractBearerToken(headerValue: string | null): string | null {
  if (headerValue === null) return null;
  const trimmed = headerValue.trim();
  if (!trimmed.toLowerCase().startsWith(BEARER_PREFIX)) return null;
  const token = trimmed.slice(BEARER_PREFIX.length).trim();
  return token === '' ? null : token;
}

/**
 * Creates a Supabase client that forwards the caller's JWT, so RLS applies.
 *
 * `persistSession` and `autoRefreshToken` are disabled because an Edge Function
 * isolate is stateless and may be reused across callers; persisting a session
 * would risk one request observing another's identity.
 */
export function createUserScopedClient(config: AppConfig, accessToken: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Creates a service-role client that BYPASSES ALL RLS POLICIES.
 *
 * Legitimate uses are narrow and all share one trait: the operation is not
 * acting on behalf of the caller.
 *   - Writing rows a user must not be able to forge (e.g. AI usage counters).
 *   - Scheduled jobs that run with no user in the loop (Blueprint §4.6).
 *   - Administrative actions already gated by a separate authorisation check.
 *
 * Never use this to read or return data belonging to the caller — see the
 * module header for why.
 */
export function createServiceRoleClient(config: AppConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Resolves the caller's identity from the request.
 *
 * Validation is delegated to the Auth server via `getUser`, which is
 * authoritative: it honours revoked sessions and rotated refresh tokens, which
 * local signature verification alone would not. The cost is one internal
 * round-trip, budgeted within Blueprint NFR-10 (p95 < 800ms excluding external
 * APIs). If that budget ever tightens, the alternative is local JWT signature
 * verification against the project secret, trading revocation-awareness for
 * latency — a deliberate trade, not an optimisation to apply casually.
 *
 * @returns the resolved context, or `null` when no credentials were presented.
 * @throws {AppError} `unauthenticated` when a token is present but not valid.
 */
export async function resolveAuthContext(
  request: Request,
  config: AppConfig,
): Promise<AuthContext | null> {
  const token = extractBearerToken(request.headers.get('Authorization'));
  if (token === null) return null;

  const db = createUserScopedClient(config, token);
  const { data, error } = await db.auth.getUser(token);

  if (error !== null || data.user === null) {
    throw Errors.unauthenticated({
      details: { reason: error?.message ?? 'no_user_for_token' },
    });
  }

  return { authId: data.user.id, user: data.user, db };
}
