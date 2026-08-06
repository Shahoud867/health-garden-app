/**
 * Kernel behaviour tests.
 *
 * These assert the cross-cutting guarantees every endpoint inherits, so an
 * individual function never has to re-test them: correlation ids, the error
 * envelope, method and version gating, validation ordering, and the rule that
 * unexpected throws never leak internals to a caller.
 */

import { assertEquals, assertNotEquals } from '@std/assert';
import { z } from '../deps.ts';
import { resetConfigCache } from '../config/env.ts';
import { defineEndpoint } from './endpoint.ts';
import { ErrorCode, Errors } from './errors.ts';
import { API_VERSION_HEADER, REQUEST_ID_HEADER } from '../version.ts';

function withTestEnvironment(): void {
  Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321');
  Deno.env.set('SUPABASE_ANON_KEY', 'test-anon-key');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  Deno.env.set('APP_ENV', 'local');
  // Silence request logging so test output stays readable.
  Deno.env.set('LOG_LEVEL', 'error');
  resetConfigCache();
}

function request(
  method: string,
  init: { body?: unknown; headers?: Record<string, string> } = {},
): Request {
  return new Request('http://localhost/fn', {
    method,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
}

Deno.test('kernel', async (t) => {
  withTestEnvironment();

  await t.step('answers CORS preflight without auth or version checks', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'required',
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('OPTIONS'));

    assertEquals(response.status, 204);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  });

  await t.step('returns a handler value as JSON with correlation headers', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => ({ status: 'ok' }),
    });

    const response = await handler(request('GET'));

    assertEquals(response.status, 200);
    assertEquals(await response.json(), { status: 'ok' });
    assertNotEquals(response.headers.get(REQUEST_ID_HEADER), null);
    assertEquals(response.headers.get('Cache-Control'), 'private, no-store');
    assertEquals(response.headers.get('X-Content-Type-Options'), 'nosniff');
  });

  await t.step('echoes a caller-supplied correlation id', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('GET', { headers: { 'x-request-id': 'trace-42' } }));
    assertEquals(response.headers.get(REQUEST_ID_HEADER), 'trace-42');
  });

  await t.step('returns 204 when a handler produces no value', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      handler: () => undefined,
    });

    assertEquals((await handler(request('POST'))).status, 204);
  });

  await t.step('rejects a disallowed method', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('DELETE'));

    assertEquals(response.status, 405);
    assertEquals((await response.json()).error, ErrorCode.METHOD_NOT_ALLOWED);
  });

  await t.step('rejects an unsupported API contract version', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('GET', { headers: { [API_VERSION_HEADER]: '99' } }));

    assertEquals(response.status, 400);
    assertEquals((await response.json()).error, ErrorCode.UNSUPPORTED_API_VERSION);
  });

  await t.step('accepts a request that omits the version header', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => ({ ok: true }),
    });

    // Early client builds predate the header; rejecting them would break
    // existing installs for no safety gain.
    assertEquals((await handler(request('GET'))).status, 200);
  });

  await t.step('rejects an unauthenticated call to a protected endpoint', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'required',
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('GET'));

    assertEquals(response.status, 401);
    assertEquals((await response.json()).error, ErrorCode.UNAUTHENTICATED);
  });

  await t.step('rejects a body that fails schema validation', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      bodySchema: z.object({ message: z.string().min(1) }),
      handler: () => ({ ok: true }),
    });

    const response = await handler(request('POST', { body: { message: '' } }));

    assertEquals(response.status, 400);
    assertEquals((await response.json()).error, ErrorCode.INVALID_PAYLOAD);
  });

  await t.step('rejects malformed JSON', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      bodySchema: z.object({ message: z.string() }),
      handler: () => ({ ok: true }),
    });

    const response = await handler(
      new Request('http://localhost/fn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }),
    );

    assertEquals(response.status, 400);
    assertEquals((await response.json()).error, ErrorCode.INVALID_PAYLOAD);
  });

  await t.step('passes a validated body to the handler', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      bodySchema: z.object({ glasses: z.number().int() }),
      handler: (ctx) => ({ received: ctx.body.glasses }),
    });

    const response = await handler(request('POST', { body: { glasses: 8 } }));
    assertEquals(await response.json(), { received: 8 });
  });

  await t.step('gates on method before parsing a body', async () => {
    let parsed = false;
    const handler = defineEndpoint({
      name: 'test',
      methods: ['POST'],
      auth: 'none',
      bodySchema: z.object({}).transform((value) => {
        parsed = true;
        return value;
      }),
      handler: () => ({ ok: true }),
    });

    await handler(request('GET'));
    // Ordering is a security property: rejection happens before untrusted input
    // reaches the parser.
    assertEquals(parsed, false);
  });

  await t.step('surfaces a domain error with its declared code', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => {
        throw Errors.dailyCapReached();
      },
    });

    const response = await handler(request('GET'));

    assertEquals(response.status, 429);
    assertEquals((await response.json()).error, ErrorCode.DAILY_CAP_REACHED);
  });

  await t.step('converts an unexpected throw into an opaque 500', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => {
        throw new Error('DB password is hunter2');
      },
    });

    const response = await handler(request('GET'));
    const body = await response.json();

    assertEquals(response.status, 500);
    assertEquals(body.error, ErrorCode.INTERNAL_ERROR);
    assertEquals(JSON.stringify(body).includes('hunter2'), false);
  });

  await t.step('a 5xx still responds correctly with SENTRY_DSN configured', async () => {
    // Regression coverage for the kernel's Sentry wiring (`sentry.ts` itself
    // is fully unit-tested in isolation): the reporter's own HTTP call is
    // fire-and-forget against a real (unreachable in this test env) host, so
    // this only needs to prove that configuring it never changes the
    // response a caller gets.
    Deno.env.set('SENTRY_DSN', 'https://testkey@o0.ingest.sentry.io/1');
    resetConfigCache();
    try {
      const handler = defineEndpoint({
        name: 'test',
        methods: ['GET'],
        auth: 'none',
        handler: () => {
          throw new Error('boom');
        },
      });

      const response = await handler(request('GET'));
      assertEquals(response.status, 500);
    } finally {
      Deno.env.delete('SENTRY_DSN');
      resetConfigCache();
    }
  });

  await t.step('propagates a Response returned directly by a handler', async () => {
    const handler = defineEndpoint({
      name: 'test',
      methods: ['GET'],
      auth: 'none',
      handler: () => new Response('raw', { status: 418 }),
    });

    assertEquals((await handler(request('GET'))).status, 418);
  });
});
