/**
 * Reading `app_config` (Blueprint ADR-010) from an Edge Function.
 *
 * `app_config` has zero client-facing RLS policies (migration 0009) — it is
 * reachable only through a service-role client, by design: feature flags and
 * cost-control thresholds must never be directly readable by any client role.
 * Shared here because both `ai-chat` and `ai-plan-generate` need it.
 */

import { Errors } from '../http/errors.ts';

export interface AppConfigRow {
  readonly key: string;
  readonly value: unknown;
}

export interface AppConfigClient {
  from(table: 'app_config'): {
    select(columns: string): {
      in(
        column: string,
        values: readonly string[],
      ): PromiseLike<{ data: readonly AppConfigRow[] | null; error: { message: string } | null }>;
    };
  };
}

/** Fetches the given keys and returns them as a plain map. A key with no row
 * simply does not appear in the result — callers apply their own default. */
export async function readAppConfig(
  db: AppConfigClient,
  keys: readonly string[],
): Promise<Record<string, unknown>> {
  const { data, error } = await db.from('app_config').select('key, value').in('key', keys);
  if (error !== null) {
    throw Errors.internal({ details: { step: 'read_app_config', message: error.message } });
  }
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
}

/** JSONB values round-trip as their real JS type (§5.2's seed values are
 * booleans/numbers/arrays, not strings that happen to look like one) --
 * these helpers just apply a typed default when a key is absent. */
export function configBoolean(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = config[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function configNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];
  return typeof value === 'number' ? value : fallback;
}
