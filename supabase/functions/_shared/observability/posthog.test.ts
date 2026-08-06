import { assertEquals } from '@std/assert';
import { createPostHogClient } from './posthog.ts';

function spyFetch(): { fetch: typeof fetch; calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({ ok: true, status: 200 } as Response);
  }) as unknown as typeof fetch;
  return { fetch: impl, calls };
}

Deno.test('createPostHogClient', async (t) => {
  await t.step('is a silent no-op when no API key is configured', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const client = createPostHogClient(undefined, { host: 'https://us.i.posthog.com', fetchImpl });
    client.capture('account_deleted', 'user-1');
    assertEquals(calls.length, 0);
  });

  await t.step("posts to the configured host's /capture/ endpoint", () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const client = createPostHogClient('phc_test', {
      host: 'https://us.i.posthog.com/',
      fetchImpl,
    });
    client.capture('ai_plan_generated', 'user-1', { plan_type: 'diet' });

    assertEquals(calls.length, 1);
    assertEquals(calls[0]!.url, 'https://us.i.posthog.com/capture/');
    const body = JSON.parse(calls[0]!.init.body as string);
    assertEquals(body.api_key, 'phc_test');
    assertEquals(body.event, 'ai_plan_generated');
    assertEquals(body.distinct_id, 'user-1');
    assertEquals(body.properties.plan_type, 'diet');
  });

  await t.step('redacts sensitive properties before sending', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const client = createPostHogClient('phc_test', { host: 'https://us.i.posthog.com', fetchImpl });
    client.capture('subscription_activated', 'user-1', {
      amount_pkr: 999,
      user_email: 'someone@example.com',
    });

    const body = JSON.parse(calls[0]!.init.body as string);
    assertEquals(body.properties.amount_pkr, 999);
    assertEquals(body.properties.user_email, '[redacted]');
  });

  await t.step('never throws even when the network call fails', async () => {
    const failingFetch = (() =>
      Promise.reject(new Error('network down'))) as unknown as typeof fetch;
    const client = createPostHogClient('phc_test', {
      host: 'https://us.i.posthog.com',
      fetchImpl: failingFetch,
    });
    client.capture('account_deleted', 'user-1');
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
