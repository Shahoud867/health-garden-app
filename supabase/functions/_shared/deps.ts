/**
 * Centralized external dependencies for all Edge Functions.
 *
 * Rationale: Deno resolves imports per-file, so an unmanaged codebase drifts
 * toward multiple versions of the same library across functions. Funnelling
 * every third-party import through this module makes upgrades a one-line change
 * and keeps the dependency surface auditable in a single place — which matters
 * disproportionately for a two-person team (Blueprint NFR-7).
 *
 * Version pins live in `deno.json` under `imports`.
 */

export { z } from 'zod';
export type { ZodType } from 'zod';

export { createClient } from '@supabase/supabase-js';
export type { SupabaseClient, User } from '@supabase/supabase-js';

// Web Push (RFC 8030/8291/8292) is a genuine cryptographic protocol (VAPID
// JWT signing, AES-GCM payload encryption) -- unlike Gemini/Turnstile's plain
// fetch calls, hand-rolling this would be a real correctness/security risk
// for a two-person team, so a vetted library is the right call here.
export { default as webpush } from 'web-push';
