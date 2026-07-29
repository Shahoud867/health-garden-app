/**
 * Right-to-access data export (Blueprint §7.9, closes G-8).
 *
 * Dumps the calling user's own rows across every user-owned table to JSON.
 * Deliberately uses the caller's own RLS-scoped client (`ctx.auth.db`), never
 * the service-role client — every query below already returns exactly this
 * caller's rows because Row Level Security says so, not because this handler
 * filters by user id itself. That property is what makes this list safe to
 * extend later: a newly added user-owned table needs its RLS SELECT policy
 * regardless, and adding it here costs nothing extra in privilege risk.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';

/**
 * Every table RLS scopes to the caller. `users` first (a single row, by
 * primary key rather than `user_id`); the rest follow §5.2/§11.11's grouping.
 */
const EXPORTABLE_TABLES = [
  'users',
  'food_logs',
  'workout_logs',
  'water_logs',
  'weight_logs',
  'garden_state',
  'permanent_garden',
  'subscriptions',
  'payment_intents',
  'daily_ai_usage',
  'ai_plans',
  'symptom_logs',
  'push_tokens',
  'audit_log',
  'organization_members',
] as const;

export interface AccountExportResponse {
  readonly exportedAt: string;
  readonly data: Record<(typeof EXPORTABLE_TABLES)[number], readonly Record<string, unknown>[]>;
}

/** The minimal shape this handler needs from a Supabase client — narrowed so
 * tests can inject a fake without a live Supabase stack (Blueprint §13.5). */
export interface QueryableClient {
  from(table: string): {
    select(columns: string): PromiseLike<{
      data: readonly Record<string, unknown>[] | null;
      error: { code: string; message: string } | null;
    }>;
  };
}

/**
 * The exportable core, factored out of `handleAccountExport` so it can be
 * unit-tested against a fake client — resolving a real auth context needs a
 * live Supabase Auth server, which a Deno unit test does not have (Blueprint
 * §13.5 assigns that verification to the Vitest suite against a real stack
 * instead; this function is what that split makes independently testable).
 */
export async function buildAccountExport(db: QueryableClient): Promise<AccountExportResponse> {
  const entries = await Promise.all(
    EXPORTABLE_TABLES.map(async (table) => {
      const { data, error } = await db.from(table).select('*');
      if (error !== null) {
        throw Errors.internal({
          details: { table, code: error.code, message: error.message },
        });
      }
      return [table, data ?? []] as const;
    }),
  );

  return {
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(entries) as AccountExportResponse['data'],
  };
}

export const handleAccountExport = defineEndpoint<undefined, AccountExportResponse>({
  name: 'account-export',
  methods: ['GET'],
  auth: 'required',
  handler: (ctx) => buildAccountExport(ctx.auth!.db),
});
