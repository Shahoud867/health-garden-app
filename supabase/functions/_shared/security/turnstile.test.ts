import { assertEquals } from '@std/assert';
import { verifyTurnstileToken } from './turnstile.ts';

function fakeFetch(response: { ok: boolean; status?: number; body?: unknown }): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: () => Promise.resolve(response.body ?? {}),
    })) as unknown as typeof fetch;
}

Deno.test('verifyTurnstileToken', async (t) => {
  await t.step('succeeds when Cloudflare reports success', async () => {
    const result = await verifyTurnstileToken({
      secretKey: 'secret',
      token: 'a-real-looking-token',
      fetchImpl: fakeFetch({ ok: true, body: { success: true } }),
    });
    assertEquals(result, { success: true, errorCodes: [] });
  });

  await t.step('fails and surfaces Cloudflare error codes', async () => {
    const result = await verifyTurnstileToken({
      secretKey: 'secret',
      token: 'stale-token',
      fetchImpl: fakeFetch({
        ok: true,
        body: { success: false, 'error-codes': ['timeout-or-duplicate'] },
      }),
    });
    assertEquals(result, { success: false, errorCodes: ['timeout-or-duplicate'] });
  });

  await t.step('fails closed on a non-2xx response, without throwing', async () => {
    const result = await verifyTurnstileToken({
      secretKey: 'secret',
      token: 'anything',
      fetchImpl: fakeFetch({ ok: false, status: 503 }),
    });
    assertEquals(result.success, false);
    assertEquals(result.errorCodes, ['http-503']);
  });

  await t.step('fails closed on a network error, without throwing', async () => {
    const throwingFetch = (() =>
      Promise.reject(new Error('DNS lookup failed'))) as unknown as typeof fetch;
    const result = await verifyTurnstileToken({
      secretKey: 'secret',
      token: 'anything',
      fetchImpl: throwingFetch,
    });
    assertEquals(result, { success: false, errorCodes: ['network-error'] });
  });

  await t.step('rejects an empty token without making a network call', async () => {
    let called = false;
    const spyFetch = (() => {
      called = true;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }) as unknown as typeof fetch;

    const result = await verifyTurnstileToken({
      secretKey: 'secret',
      token: '   ',
      fetchImpl: spyFetch,
    });

    assertEquals(result, { success: false, errorCodes: ['missing-input-response'] });
    assertEquals(called, false);
  });

  await t.step('includes remoteip in the request body when provided', async () => {
    let capturedBody: string | undefined;
    const spyFetch = ((_url: string, init?: RequestInit) => {
      capturedBody = init?.body?.toString();
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }) as unknown as typeof fetch;

    await verifyTurnstileToken({
      secretKey: 'secret',
      token: 'a-token',
      remoteIp: '203.0.113.7',
      fetchImpl: spyFetch,
    });

    assertEquals(capturedBody?.includes('remoteip=203.0.113.7'), true);
  });
});
