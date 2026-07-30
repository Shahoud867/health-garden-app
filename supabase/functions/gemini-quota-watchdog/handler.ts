/**
 * Gemini quota watchdog (Blueprint §4.6, ADR-010). Cron-triggered every 30
 * minutes via invoke_edge_function() -- see `_shared/security/service-role-auth.ts`
 * for the auth mechanism.
 *
 * Disable-only, deliberately: this never re-enables `ai_chat_enabled` once
 * it flips it off. A kill switch that quietly resets itself once usage drops
 * isn't a kill switch -- a founder confirming it's safe to re-enable is the
 * point, not friction to route around.
 *
 * "Alerts" here means a structured, high-severity log entry -- real Sentry
 * wiring is Phase 8 (Production Readiness); this is what makes that wiring
 * meaningful once it exists, rather than inventing a notification channel
 * ahead of the observability stack ADR-013 actually specifies.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { isServiceRoleCaller } from '../_shared/security/service-role-auth.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import type { Logger } from '../_shared/observability/logger.ts';

// 80% of Gemini's known free-tier ceiling, ~1,500 requests/day project-wide
// (Founder_B_Backend_Roadmap.md §7.1) -- matches §4.6's "80% of known quota."
const QUOTA_THRESHOLD = 1200;

export interface WatchdogResponse {
  readonly totalUsageToday: number;
  readonly threshold: number;
  readonly disabledJustNow: boolean;
}

export interface UsageSumClient {
  rpc(
    fn: 'sum_todays_ai_usage',
  ): PromiseLike<{ data: number | null; error: { message: string } | null }>;
}

export interface AiConfigClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: unknown,
      ): PromiseLike<{
        data: readonly Record<string, unknown>[] | null;
        error: { message: string } | null;
      }>;
    };
    update(row: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

export async function checkGeminiQuota(deps: {
  readonly usageDb: UsageSumClient;
  readonly configDb: AiConfigClient;
  readonly logger: Pick<Logger, 'error'>;
}): Promise<WatchdogResponse> {
  const { usageDb, configDb, logger } = deps;

  const { data: total, error } = await usageDb.rpc('sum_todays_ai_usage');
  if (error !== null || total === null) {
    throw Errors.internal({ details: { step: 'sum_usage', message: error?.message } });
  }

  if (total < QUOTA_THRESHOLD) {
    return { totalUsageToday: total, threshold: QUOTA_THRESHOLD, disabledJustNow: false };
  }

  const { data: configRows, error: configError } = await configDb
    .from('app_config')
    .select('value')
    .eq('key', 'ai_chat_enabled');
  if (configError !== null) {
    throw Errors.internal({ details: { step: 'read_config', message: configError.message } });
  }
  const currentlyEnabled = (configRows?.[0]?.value as boolean | undefined) ?? true;

  if (!currentlyEnabled) {
    // Already disabled by a previous run today -- nothing changed, no need
    // to re-log the same alert every 30 minutes for the rest of the day.
    return { totalUsageToday: total, threshold: QUOTA_THRESHOLD, disabledJustNow: false };
  }

  const { error: updateError } = await configDb
    .from('app_config')
    .update({ value: false, updated_at: new Date().toISOString() })
    .eq('key', 'ai_chat_enabled');
  if (updateError !== null) {
    throw Errors.internal({ details: { step: 'disable_ai_chat', message: updateError.message } });
  }

  logger.error('gemini_quota_threshold_reached', {
    totalUsageToday: total,
    threshold: QUOTA_THRESHOLD,
  });

  return { totalUsageToday: total, threshold: QUOTA_THRESHOLD, disabledJustNow: true };
}

export const handleGeminiQuotaWatchdog = defineEndpoint<undefined, WatchdogResponse>({
  name: 'gemini-quota-watchdog',
  methods: ['POST'],
  auth: 'none',
  handler: (ctx) => {
    if (!isServiceRoleCaller(ctx.req, ctx.config.supabaseServiceRoleKey)) {
      throw Errors.forbidden();
    }

    const serviceDb = createServiceRoleClient(ctx.config);
    return checkGeminiQuota({
      usageDb: serviceDb as unknown as UsageSumClient,
      configDb: serviceDb as unknown as AiConfigClient,
      logger: ctx.logger,
    });
  },
});
