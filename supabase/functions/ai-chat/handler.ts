/**
 * Capped daily coaching chat (Blueprint §4.3/§6.2/§12.5, ADR-003).
 *
 * Order matters and mirrors §4.3's sequence exactly: verify premium -> check
 * the kill switch -> check-and-increment the usage cap -> only then call
 * Gemini. Nothing here can call Gemini before the cap check has already
 * succeeded, which is the entire cost-control mechanism (ADR-003) -- checking
 * afterwards would mean the call already happened.
 *
 * On any Gemini failure (error or the 10s timeout, §2.13), this returns 200
 * with a templated fallback message, never an error -- "the premium AI
 * feature degrades gracefully to the free-tier experience rather than
 * failing open or failing hard."
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import {
  type AppConfigClient,
  configBoolean,
  configNumber,
  readAppConfig,
} from '../_shared/config/app-config.ts';
import { parseConditionsTag } from '../_shared/validation/conditions.ts';
import type { AiProvider } from '../_shared/ai/provider.ts';
import { createGeminiProviderFromEnv } from '../_shared/ai/gemini-provider.ts';
import { checkOutputSafety, SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';
import { buildFallbackMessage, type GardenHighlight } from '../_shared/ai/fallback-message.ts';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
});

export interface ChatResponse {
  readonly reply: string;
}

interface ProfileRow {
  readonly id: string;
  readonly is_premium: boolean;
  readonly conditions: string | null;
}

interface GardenRow {
  readonly goal_type: string;
  readonly plant_type: string;
  readonly days_succeeded_this_week: number;
}

/** A single, non-overloaded `from(table: string)` shape (rather than
 * per-table literal overloads) -- narrowing to specific table-name literals
 * here previously sent `deno check` into "type instantiation is excessively
 * deep" against supabase-js's own already-complex generic query builder. The
 * generic-string version typechecks cleanly and is exactly the shape
 * `account-export`'s `QueryableClient` already uses for the same reason. */
export interface ChatUserClient {
  from(table: string): {
    select(columns: string): PromiseLike<{
      data: readonly Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  };
}

export interface ChatServiceClient extends AppConfigClient {
  rpc(
    fn: 'increment_daily_ai_usage',
    args: { p_user_id: string },
  ): PromiseLike<{ data: number | null; error: { message: string } | null }>;
}

function summarizeHighlights(highlights: readonly GardenHighlight[]): string {
  if (highlights.length === 0) return 'no logs yet';
  const best = highlights.reduce((top, current) =>
    current.daysSucceededThisWeek > top.daysSucceededThisWeek ? current : top
  );
  return `${best.goalType}: ${best.daysSucceededThisWeek}/7 days this week`;
}

/**
 * The chat core, factored out for the same reason every other Phase 4/5
 * handler factors its core out: resolving a real session needs a live
 * Supabase Auth server that a Deno unit test does not have (Blueprint §13.5).
 */
export async function handleChatMessage(deps: {
  readonly userDb: ChatUserClient;
  readonly serviceDb: ChatServiceClient;
  readonly aiProvider: AiProvider;
  readonly message: string;
}): Promise<ChatResponse> {
  const { userDb, serviceDb, aiProvider, message } = deps;

  const { data: profileRows, error: profileError } = await userDb
    .from('users')
    .select('id, is_premium, conditions');
  const profile = (profileRows?.[0] as unknown as ProfileRow | undefined) ?? null;
  if (profileError !== null || profile === null) {
    throw Errors.internal({ details: { step: 'resolve_profile', message: profileError?.message } });
  }
  if (!profile.is_premium) {
    throw Errors.upgradeRequired();
  }

  const config = await readAppConfig(serviceDb, ['ai_chat_enabled', 'ai_daily_cap']);
  if (!configBoolean(config, 'ai_chat_enabled', true)) {
    throw Errors.featureDisabled();
  }
  const cap = configNumber(config, 'ai_daily_cap', 15);

  const { data: newCount, error: incrementError } = await serviceDb.rpc(
    'increment_daily_ai_usage',
    {
      p_user_id: profile.id,
    },
  );
  if (incrementError !== null || newCount === null) {
    throw Errors.internal({
      details: { step: 'increment_usage', message: incrementError?.message },
    });
  }
  if (newCount > cap) {
    throw Errors.dailyCapReached();
  }

  const { data: gardenRows, error: gardenError } = await userDb
    .from('garden_state')
    .select('goal_type, plant_type, days_succeeded_this_week');
  if (gardenError !== null) {
    throw Errors.internal({ details: { step: 'read_garden_state', message: gardenError.message } });
  }
  const highlights: GardenHighlight[] = ((gardenRows ?? []) as unknown as readonly GardenRow[]).map(
    (row) => ({
      goalType: row.goal_type,
      plantType: row.plant_type,
      daysSucceededThisWeek: row.days_succeeded_this_week,
    }),
  );

  try {
    const reply = await aiProvider.chat(message, {
      conditions: parseConditionsTag(profile.conditions),
      recentGardenSummary: summarizeHighlights(highlights),
    });
    const safety = checkOutputSafety(reply);
    return { reply: safety.safe ? reply : SAFE_FALLBACK_MESSAGE };
  } catch {
    // Gemini error or 10s timeout (§2.13) -- degrade to the free-tier-style
    // templated experience rather than surfacing an error for a premium call
    // that already reserved its slot in today's cap.
    return { reply: buildFallbackMessage(highlights) };
  }
}

let cachedProvider: AiProvider | undefined;

export const handleAiChat = defineEndpoint<z.infer<typeof bodySchema>, ChatResponse>({
  name: 'ai-chat',
  methods: ['POST'],
  auth: 'required',
  bodySchema,
  handler: (ctx) => {
    cachedProvider ??= createGeminiProviderFromEnv();
    return handleChatMessage({
      userDb: ctx.auth!.db,
      // supabase-js's real `.rpc()` overload set sends `deno check` into
      // "type instantiation is excessively deep" when structurally checked
      // against ChatServiceClient's narrow, literal-argument version --
      // a type-checker performance cliff, not a real incompatibility (the
      // real client supports exactly this call at runtime). The narrow
      // interface still does its job: the Deno tests inject a plain object
      // matching it with no cast needed at all.
      serviceDb: createServiceRoleClient(ctx.config) as unknown as ChatServiceClient,
      aiProvider: cachedProvider,
      message: ctx.body.message,
    });
  },
});
