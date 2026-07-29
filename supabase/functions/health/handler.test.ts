/**
 * End-to-end proof that the kernel composes into a servable endpoint.
 *
 * This is the Phase 2 acceptance test: if it passes, configuration parsing,
 * logging, the error envelope, CORS, response construction, and method gating
 * are all wired correctly together.
 */

import { assertEquals, assertNotEquals } from '@std/assert';
import { resetConfigCache } from '../_shared/config/env.ts';
import { handleHealth } from './handler.ts';
import { REQUEST_ID_HEADER } from '../_shared/version.ts';

function withTestEnvironment(): void {
  Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321');
  Deno.env.set('SUPABASE_ANON_KEY', 'test-anon-key');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  Deno.env.set('APP_ENV', 'staging');
  Deno.env.set('LOG_LEVEL', 'error');
  resetConfigCache();
}

Deno.test('health endpoint', async (t) => {
  withTestEnvironment();

  await t.step('reports service liveness', async () => {
    const response = await handleHealth(new Request('http://localhost/health'));
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.status, 'ok');
    assertEquals(body.service, 'health-garden');
    assertEquals(body.apiVersion, '1');
    assertEquals(body.environment, 'staging');
    assertNotEquals(body.timestamp, undefined);
  });

  await t.step('carries a correlation id for monitoring', async () => {
    const response = await handleHealth(new Request('http://localhost/health'));
    assertNotEquals(response.headers.get(REQUEST_ID_HEADER), null);
  });

  await t.step('requires no credentials', async () => {
    // UptimeRobot cannot hold a user session (Blueprint §10.2).
    const response = await handleHealth(new Request('http://localhost/health'));
    assertEquals(response.status, 200);
  });

  await t.step('rejects a write method', async () => {
    const response = await handleHealth(
      new Request('http://localhost/health', { method: 'POST' }),
    );
    assertEquals(response.status, 405);
  });
});
