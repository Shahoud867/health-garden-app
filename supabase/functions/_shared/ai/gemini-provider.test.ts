import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { GeminiProvider, GeminiRequestError } from './gemini-provider.ts';

function fakeFetch(body: unknown, ok = true, status = 200): typeof fetch {
  return (() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
    })) as unknown as typeof fetch;
}

Deno.test('GeminiProvider.chat', async (t) => {
  await t.step('returns the text from the first candidate', async () => {
    const provider = new GeminiProvider(
      'test-key',
      'gemini-2.0-flash',
      fakeFetch({ candidates: [{ content: { parts: [{ text: 'Try a short walk today.' }] } }] }),
    );

    const reply = await provider.chat('What should I do today?', {
      conditions: [],
      recentGardenSummary: 'no data yet',
    });
    assertEquals(reply, 'Try a short walk today.');
  });

  await t.step('sends the hardened system prompt and the user message', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const spyFetch = ((_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init!.body as string);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }),
      });
    }) as unknown as typeof fetch;

    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash', spyFetch);
    await provider.chat('hello', { conditions: ['pcos'], recentGardenSummary: 'doing fine' });

    const systemText = (capturedBody!.systemInstruction as { parts: { text: string }[] })
      .parts[0]!.text;
    assertStringIncludes(systemText.toLowerCase(), 'never reveal');
    const userText = (capturedBody!.contents as { parts: { text: string }[] }[])[0]!.parts[0]!
      .text;
    assertEquals(userText, 'hello');
  });

  await t.step('throws GeminiRequestError on a non-2xx response', async () => {
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash', fakeFetch({}, false, 503));
    await assertRejects(
      () => provider.chat('hi', { conditions: [], recentGardenSummary: '' }),
      GeminiRequestError,
    );
  });

  await t.step('throws GeminiRequestError when the response has no text', async () => {
    const provider = new GeminiProvider(
      'test-key',
      'gemini-2.0-flash',
      fakeFetch({ candidates: [] }),
    );
    await assertRejects(
      () => provider.chat('hi', { conditions: [], recentGardenSummary: '' }),
      GeminiRequestError,
    );
  });

  await t.step('throws GeminiRequestError on a network failure, not a raw Error', async () => {
    const throwingFetch = (() =>
      Promise.reject(new Error('DNS failure'))) as unknown as typeof fetch;
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash', throwingFetch);
    await assertRejects(
      () => provider.chat('hi', { conditions: [], recentGardenSummary: '' }),
      GeminiRequestError,
    );
  });
});

Deno.test('GeminiProvider.generatePlan', async (t) => {
  await t.step('wraps the response text with provider metadata', async () => {
    const provider = new GeminiProvider(
      'test-key',
      'gemini-2.0-flash',
      fakeFetch({ candidates: [{ content: { parts: [{ text: 'Day 1: ...' }] } }] }),
    );

    const plan = await provider.generatePlan({
      goal: 'weight_loss',
      conditions: [],
      activityLevel: 'moderate',
      dailyCalorieTarget: 1800,
      dailyProteinTargetG: 90,
    });

    assertEquals(plan.text, 'Day 1: ...');
    assertEquals(plan.generatedWith, 'gemini:gemini-2.0-flash');
  });
});
