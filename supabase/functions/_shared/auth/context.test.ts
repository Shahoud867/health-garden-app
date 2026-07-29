import { assertEquals } from '@std/assert';
import { extractBearerToken } from './context.ts';

Deno.test('extractBearerToken reads a well-formed header', () => {
  assertEquals(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
});

Deno.test('extractBearerToken accepts any casing of the scheme', () => {
  // RFC 7235 defines the auth scheme as case-insensitive; clients and proxies
  // in practice send all three of these.
  assertEquals(extractBearerToken('bearer token'), 'token');
  assertEquals(extractBearerToken('BEARER token'), 'token');
  assertEquals(extractBearerToken('BeArEr token'), 'token');
});

Deno.test('extractBearerToken tolerates surrounding whitespace', () => {
  assertEquals(extractBearerToken('  Bearer   token  '), 'token');
});

Deno.test('extractBearerToken returns null when no credentials are present', () => {
  assertEquals(extractBearerToken(null), null);
  assertEquals(extractBearerToken(''), null);
  assertEquals(extractBearerToken('Bearer'), null);
  assertEquals(extractBearerToken('Bearer   '), null);
});

Deno.test('extractBearerToken rejects other authentication schemes', () => {
  assertEquals(extractBearerToken('Basic dXNlcjpwYXNz'), null);
  assertEquals(extractBearerToken('token-without-scheme'), null);
});
