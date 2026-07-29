import { assertEquals } from '@std/assert';
import { API_VERSION, isSupportedApiVersion, SUPPORTED_API_VERSIONS } from './version.ts';

Deno.test('the current version is among the supported set', () => {
  assertEquals(SUPPORTED_API_VERSIONS.includes(API_VERSION), true);
});

Deno.test('a supported version is accepted', () => {
  assertEquals(isSupportedApiVersion('1'), true);
  assertEquals(isSupportedApiVersion(' 1 '), true);
});

Deno.test('an absent version is treated as compatible', () => {
  // Client builds that predate the header must keep working.
  assertEquals(isSupportedApiVersion(null), true);
  assertEquals(isSupportedApiVersion(''), true);
});

Deno.test('an unknown version is rejected', () => {
  assertEquals(isSupportedApiVersion('2'), false);
  assertEquals(isSupportedApiVersion('abc'), false);
});
