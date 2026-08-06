import { assertEquals, assertStringIncludes } from '@std/assert';
import { createSentryReporter } from './sentry.ts';

const VALID_DSN = 'https://examplepublickey@o0.ingest.sentry.io/1234567';

function spyFetch(): { fetch: typeof fetch; calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({ ok: true, status: 200 } as Response);
  }) as unknown as typeof fetch;
  return { fetch: impl, calls };
}

Deno.test('createSentryReporter', async (t) => {
  await t.step('is a silent no-op when no DSN is configured', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter(undefined, { environment: 'local', fetchImpl });
    reporter.captureException(new Error('boom'), {});
    assertEquals(calls.length, 0);
  });

  await t.step('is a silent no-op on a malformed DSN, never throws', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter('not-a-real-dsn', { environment: 'local', fetchImpl });
    reporter.captureException(new Error('boom'), {});
    assertEquals(calls.length, 0);
  });

  await t.step('posts an envelope to the DSN project ingest URL', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter(VALID_DSN, { environment: 'production', fetchImpl });
    reporter.captureException(new Error('boom'), {});

    assertEquals(calls.length, 1);
    assertEquals(calls[0]!.url, 'https://o0.ingest.sentry.io/api/1234567/envelope/');
    const auth = (calls[0]!.init.headers as Record<string, string>)['X-Sentry-Auth'];
    assertStringIncludes(auth ?? '', 'sentry_key=examplepublickey');
  });

  await t.step('includes the error message, name, and configured environment', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter(VALID_DSN, { environment: 'staging', fetchImpl });
    reporter.captureException(new TypeError('bad input'), {});

    const body = calls[0]!.init.body as string;
    const eventLine = body.trim().split('\n')[2]!;
    const event = JSON.parse(eventLine);
    assertEquals(event.environment, 'staging');
    assertEquals(event.exception.values[0].type, 'TypeError');
    assertEquals(event.exception.values[0].value, 'bad input');
  });

  await t.step('handles a non-Error throw without crashing', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter(VALID_DSN, { environment: 'local', fetchImpl });
    reporter.captureException('a plain string throw', {});

    const body = calls[0]!.init.body as string;
    const event = JSON.parse(body.trim().split('\n')[2]!);
    assertEquals(event.exception.values[0].value, 'a plain string throw');
  });

  await t.step('redacts sensitive context fields before sending', () => {
    const { fetch: fetchImpl, calls } = spyFetch();
    const reporter = createSentryReporter(VALID_DSN, { environment: 'local', fetchImpl });
    reporter.captureException(new Error('boom'), {
      user_email: 'someone@example.com',
      weight_kg: 74,
      request_id: 'safe-to-keep',
    });

    const body = calls[0]!.init.body as string;
    const event = JSON.parse(body.trim().split('\n')[2]!);
    assertEquals(event.extra.user_email, '[redacted]');
    assertEquals(event.extra.weight_kg, '[redacted]');
    assertEquals(event.extra.request_id, 'safe-to-keep');
  });

  await t.step('never throws or rejects even when the network call fails', async () => {
    const failingFetch = (() =>
      Promise.reject(new Error('network down'))) as unknown as typeof fetch;
    const reporter = createSentryReporter(VALID_DSN, {
      environment: 'local',
      fetchImpl: failingFetch,
    });
    // Synchronous call must not throw; the rejected promise inside must not
    // surface as an unhandled rejection either (module swallows it).
    reporter.captureException(new Error('boom'), {});
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
