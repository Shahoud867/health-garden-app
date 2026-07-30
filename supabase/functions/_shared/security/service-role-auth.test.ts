import { assertEquals } from '@std/assert';
import { isServiceRoleCaller } from './service-role-auth.ts';

function requestWithAuth(headerValue: string | null): Request {
  const headers = new Headers();
  if (headerValue !== null) headers.set('Authorization', headerValue);
  return new Request('http://localhost/cron-target', { headers });
}

Deno.test('isServiceRoleCaller', async (t) => {
  await t.step('accepts the exact service-role key as a bearer token', () => {
    const result = isServiceRoleCaller(
      requestWithAuth('Bearer real-service-role-key'),
      'real-service-role-key',
    );
    assertEquals(result, true);
  });

  await t.step('rejects a missing Authorization header', () => {
    assertEquals(isServiceRoleCaller(requestWithAuth(null), 'real-service-role-key'), false);
  });

  await t.step('rejects a non-bearer scheme', () => {
    assertEquals(
      isServiceRoleCaller(requestWithAuth('Basic real-service-role-key'), 'real-service-role-key'),
      false,
    );
  });

  await t.step('rejects a token of the wrong value', () => {
    assertEquals(
      isServiceRoleCaller(requestWithAuth('Bearer someone-elses-key'), 'real-service-role-key'),
      false,
    );
  });

  await t.step('rejects a token that only differs in length', () => {
    assertEquals(
      isServiceRoleCaller(
        requestWithAuth('Bearer real-service-role-key-extra'),
        'real-service-role-key',
      ),
      false,
    );
  });
});
