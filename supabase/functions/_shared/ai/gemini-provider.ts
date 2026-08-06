/**
 * The sole current AiProvider implementation (Blueprint §3.6, §6.6, ADR-022).
 *
 * Talks to Gemini's plain REST API via `fetch` rather than the SDK — this
 * project avoids adding a dependency where a handful of `fetch` calls
 * suffice (the same reasoning that kept the Edge Function kernel hand-built
 * instead of adopting Hono/Oak, ADR-0023).
 *
 * Read directly from `Deno.env`, not the shared `AppConfig` (config/env.ts):
 * only the two AI endpoints need `GEMINI_API_KEY`, and `AppConfig` is
 * fail-fast for *every* function, including ones (health, account-export)
 * that have no reason to require it — the same reasoning already applied to
 * `TURNSTILE_SECRET_KEY` in `_shared/security/turnstile.ts`.
 */

import type { AiProvider, PlanContent, PlanRequest, UserContext } from './provider.ts';
import { buildChatSystemPrompt, buildPlanSystemPrompt } from './system-prompt.ts';
import { buildPlanUserPrompt, maxOutputTokensFor } from './plan-prompt.ts';

const CHAT_MAX_OUTPUT_TOKENS = 512;

// gemini-2.0-flash was retired 1 June 2026 (Google's deprecations page);
// gemini-3.5-flash is the current recommended replacement. This is a plain
// config default — GEMINI_MODEL always wins when set (createGeminiProviderFromEnv,
// below) — but the default itself must not be a dead model, since a dead
// model here means every environment that forgets to set GEMINI_MODEL is
// silently broken (chat degrades to a templated fallback with no error;
// ai-plan-generate fails loudly). Re-verify this default whenever Google
// publishes a new deprecation: https://ai.google.dev/gemini-api/docs/deprecations
const DEFAULT_MODEL = 'gemini-3.5-flash';
const REQUEST_TIMEOUT_MS = 10_000; // Blueprint §2.13/§4.10

/** Thrown on any failure to reach Gemini or parse its response — the one
 * error type callers need to catch to trigger the graceful fallback (§2.13). */
export class GeminiRequestError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'GeminiRequestError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

interface GeminiResponseBody {
  readonly candidates?: readonly {
    readonly content?: { readonly parts?: readonly { readonly text?: string }[] };
  }[];
}

export class GeminiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  chat(message: string, context: UserContext): Promise<string> {
    return this.generateText(buildChatSystemPrompt(context), message, CHAT_MAX_OUTPUT_TOKENS);
  }

  async generatePlan(request: PlanRequest): Promise<PlanContent> {
    const prompt = buildPlanUserPrompt(request);
    const text = await this.generateText(
      buildPlanSystemPrompt(),
      prompt,
      maxOutputTokensFor(request.planType),
    );
    return { text, generatedWith: `gemini:${this.model}` };
  }

  private async generateText(
    systemPrompt: string,
    userMessage: string,
    maxOutputTokens: number,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await this.fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens, temperature: 0.6 },
          }),
        },
      );

      if (!response.ok) {
        throw new GeminiRequestError(`Gemini returned HTTP ${response.status}`);
      }

      const body = (await response.json()) as GeminiResponseBody;
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text === undefined || text.trim() === '') {
        throw new GeminiRequestError('Gemini response contained no text');
      }
      return text;
    } catch (cause) {
      if (cause instanceof GeminiRequestError) throw cause;
      throw new GeminiRequestError('Failed to reach Gemini', { cause });
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Reads GEMINI_API_KEY/GEMINI_MODEL from the ambient environment — the
 * only place these two Edge Functions need to fail fast on a missing key,
 * not every function via the shared AppConfig. */
export function createGeminiProviderFromEnv(): GeminiProvider {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (apiKey === undefined || apiKey.trim() === '') {
    throw new GeminiRequestError('Missing required environment variable "GEMINI_API_KEY"');
  }
  const model = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_MODEL;
  return new GeminiProvider(apiKey, model);
}
