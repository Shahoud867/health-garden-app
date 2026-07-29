/**
 * Redaction is a security control (Blueprint §7.9, NFR-6), so it is tested
 * directly rather than only through the logger's observable output.
 */

import { assertEquals, assertStringIncludes } from '@std/assert';
import { createLogger, type LogSink, redact } from './logger.ts';

function captureSink(): { sink: LogSink; lines: string[] } {
  const lines: string[] = [];
  return { sink: { write: (line) => lines.push(line) }, lines };
}

const FIXED_TIME = (): Date => new Date('2026-07-29T10:00:00.000Z');

Deno.test('redact masks credentials and direct identifiers', () => {
  const result = redact({
    password: 'hunter2',
    accessToken: 'jwt-value',
    email: 'user@example.com',
    apiKey: 'AIza-secret',
    safeField: 'visible',
  }) as Record<string, unknown>;

  assertEquals(result.password, '[redacted]');
  assertEquals(result.accessToken, '[redacted]');
  assertEquals(result.email, '[redacted]');
  assertEquals(result.apiKey, '[redacted]');
  assertEquals(result.safeField, 'visible');
});

Deno.test('redact masks health and body data', () => {
  const result = redact({
    conditions: 'diabetes,pcos',
    weight_kg: 68.5,
    height_cm: 170,
    symptom_severity: 4,
    notes: 'private note',
    log_date: '2026-07-29',
  }) as Record<string, unknown>;

  assertEquals(result.conditions, '[redacted]');
  assertEquals(result.weight_kg, '[redacted]');
  assertEquals(result.height_cm, '[redacted]');
  assertEquals(result.symptom_severity, '[redacted]');
  assertEquals(result.notes, '[redacted]');
  // Non-sensitive operational fields must survive, or logs lose their value.
  assertEquals(result.log_date, '2026-07-29');
});

Deno.test('redact matches sensitive keys case-insensitively and as substrings', () => {
  const result = redact({
    UserEmail: 'a@b.com',
    AUTHORIZATION: 'Bearer x',
    userWeightKg: 70,
  }) as Record<string, unknown>;

  assertEquals(result.UserEmail, '[redacted]');
  assertEquals(result.AUTHORIZATION, '[redacted]');
  assertEquals(result.userWeightKg, '[redacted]');
});

Deno.test('redact recurses through nested objects and arrays', () => {
  interface Shape {
    outer: { inner: { password: string; id: string } };
    list: Array<Record<string, unknown>>;
  }

  const result = redact({
    outer: { inner: { password: 'secret', id: 'keep' } },
    list: [{ email: 'a@b.com' }, { plain: 'value' }],
  }) as unknown as Shape;

  assertEquals(result.outer.inner.password, '[redacted]');
  assertEquals(result.outer.inner.id, 'keep');
  assertEquals(result.list[0]?.email, '[redacted]');
  assertEquals(result.list[1]?.plain, 'value');
});

Deno.test('redact terminates on cyclic structures', () => {
  const cyclic: Record<string, unknown> = { name: 'root' };
  cyclic.self = cyclic;

  const result = redact(cyclic) as Record<string, unknown>;
  assertEquals(result.name, 'root');
  // Depth-limited rather than throwing: logging must never fail a request.
  assertEquals(JSON.stringify(result).includes('[max-depth]'), true);
});

Deno.test('redact truncates oversized strings', () => {
  const result = redact('x'.repeat(1000)) as string;
  assertStringIncludes(result, '[truncated');
  assertEquals(result.length < 1000, true);
});

Deno.test('redact serialises Error instances without losing the message', () => {
  const result = redact(new Error('boom')) as Record<string, unknown>;
  assertEquals(result.name, 'Error');
  assertEquals(result.message, 'boom');
});

Deno.test('logger emits one JSON record per call', () => {
  const { sink, lines } = captureSink();
  createLogger({ level: 'debug', sink, now: FIXED_TIME }).info('request_completed', {
    status: 200,
  });

  assertEquals(lines.length, 1);
  const record = JSON.parse(lines[0] as string);
  assertEquals(record.level, 'info');
  assertEquals(record.message, 'request_completed');
  assertEquals(record.status, 200);
  assertEquals(record.time, '2026-07-29T10:00:00.000Z');
});

Deno.test('logger suppresses records below the configured level', () => {
  const { sink, lines } = captureSink();
  const logger = createLogger({ level: 'warn', sink, now: FIXED_TIME });

  logger.debug('dropped');
  logger.info('dropped');
  logger.warn('kept');
  logger.error('kept');

  assertEquals(lines.length, 2);
});

Deno.test('logger redacts sensitive context before writing', () => {
  const { sink, lines } = captureSink();
  createLogger({ level: 'debug', sink, now: FIXED_TIME }).info('profile_updated', {
    email: 'user@example.com',
    conditions: 'diabetes',
  });

  const raw = lines[0] as string;
  assertEquals(raw.includes('user@example.com'), false);
  assertEquals(raw.includes('diabetes'), false);
});

Deno.test('child logger merges base context into every record', () => {
  const { sink, lines } = captureSink();
  const child = createLogger({ level: 'debug', sink, now: FIXED_TIME })
    .child({ request_id: 'req-1' })
    .child({ endpoint: 'health' });

  child.info('request_received');

  const record = JSON.parse(lines[0] as string);
  assertEquals(record.request_id, 'req-1');
  assertEquals(record.endpoint, 'health');
});

Deno.test('logger degrades gracefully when context cannot be serialised', () => {
  const { sink, lines } = captureSink();
  const unserialisable = { big: BigInt(1) };
  // BigInt survives redaction as a string, so force a failure at JSON.stringify
  // via a throwing getter to prove the fallback path holds.
  Object.defineProperty(unserialisable, 'boom', {
    enumerable: true,
    get: () => {
      throw new Error('nope');
    },
  });

  createLogger({ level: 'debug', sink, now: FIXED_TIME }).error('failed', unserialisable);

  assertEquals(lines.length, 1);
  const record = JSON.parse(lines[0] as string);
  assertEquals(record.message, 'failed');
});
