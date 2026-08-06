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
 * "Alerts" here means a structured, high-severity (`logger.error`) log entry.
 * This function's own error paths (a failed usage-sum RPC, a failed config
 * write) also reach Sentry automatically once `SENTRY_DSN` is set -- the
 * kernel reports every 5xx centrally (`_shared/http/endpoint.ts`), so this
 * handler does not need its own reporting call. A quota threshold being
 * crossed is logged, not thrown, precisely because it is not that kind of
 * failure -- it is the watchdog doing its job.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { isServiceRoleCaller } from '../_shared/security/service-role-auth.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import {
  type AppConfigClient,
  configBoolean,
  configNumber,
  readAppConfig,
} from '../_shared/config/app-config.ts';
import type { Logger } from '../_shared/observability/logger.ts';

// Fallback only -- the real value is read from app_config
// ('gemini_quota_daily_threshold', seed.sql) so it can be corrected in
// seconds from a verified account limit, never a code deploy. 1200 is 80% of
// 1,500 requests/day, which is what gemini-3.5-flash's free tier is widely
// reported at (Google's own docs no longer publish per-model numbers --
// https://ai.google.dev/gemini-api/docs/rate-limits explicitly defers to the
// per-account AI Studio dashboard) -- a reasonable starting default, not a
// verified account-specific number. Re-check against
// https://aistudio.google.com/rate-limit and update the config row, not this
// constant, if it's wrong for this project's actual account.
const DEFAULT_QUOTA_THRESHOLD = 1200;

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

/** Unifies AppConfigClient's read shape (`select().in()`) with the write
 * this handler also needs (`update().eq()`) into one `from()` override --
 * the same "one unified from(), not colliding overloads" pattern documented
 * on ai-plan-generate's PlanServiceClient. */
export interface AiConfigClient extends AppConfigClient {
  from(table: string): {
    select(columns: string): {
      in(
        column: string,
        values: readonly string[],
      ): PromiseLike<{
        data: readonly { key: string; value: unknown }[] | null;
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

  const config = await readAppConfig(configDb, ['ai_chat_enabled', 'gemini_quota_daily_threshold']);
  const threshold = configNumber(config, 'gemini_quota_daily_threshold', DEFAULT_QUOTA_THRESHOLD);

  if (total < threshold) {
    return { totalUsageToday: total, threshold, disabledJustNow: false };
  }

  const currentlyEnabled = configBoolean(config, 'ai_chat_enabled', true);
  if (!currentlyEnabled) {
    // Already disabled by a previous run today -- nothing changed, no need
    // to re-log the same alert every 30 minutes for the rest of the day.
    return { totalUsageToday: total, threshold, disabledJustNow: false };
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
    threshold,
  });

  return { totalUsageToday: total, threshold, disabledJustNow: true };
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
