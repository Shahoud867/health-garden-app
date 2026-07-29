import { assertEquals } from '@std/assert';
import { AppError, ErrorCode, Errors, toAppError } from './errors.ts';

Deno.test('each error maps to its documented HTTP status', () => {
  assertEquals(Errors.invalidPayload().httpStatus, 400);
  assertEquals(Errors.unauthenticated().httpStatus, 401);
  assertEquals(Errors.upgradeRequired().httpStatus, 403);
  assertEquals(Errors.notFound().httpStatus, 404);
  assertEquals(Errors.methodNotAllowed().httpStatus, 405);
  assertEquals(Errors.alreadyGeneratedThisWeek().httpStatus, 409);
  assertEquals(Errors.dailyCapReached().httpStatus, 429);
  assertEquals(Errors.upstreamUnavailable().httpStatus, 503);
  assertEquals(Errors.internal().httpStatus, 500);
});

Deno.test('response body carries only the error code and user message', () => {
  const body = Errors.dailyCapReached().toResponseBody();

  assertEquals(body.error, ErrorCode.DAILY_CAP_REACHED);
  assertEquals(Object.keys(body).sort(), ['error', 'message']);
});

Deno.test('internal diagnostics never reach the response body', () => {
  const error = Errors.internal({
    details: { connectionString: 'postgres://user:pw@host/db' },
  });

  const serialised = JSON.stringify(error.toResponseBody());
  assertEquals(serialised.includes('postgres://'), false);
  // …but remain available for logging.
  assertEquals(error.details?.connectionString, 'postgres://user:pw@host/db');
});

Deno.test('user-facing copy can be overridden per call site', () => {
  const error = Errors.forbidden({ userMessage: 'This garden belongs to someone else.' });
  assertEquals(error.toResponseBody().message, 'This garden belongs to someone else.');
});

Deno.test('default copy follows the product tone guardrail', () => {
  // Blueprint NFR-9 / §3.3: no exclamation marks, no alarm, in a product that
  // touches food and body image.
  for (const code of Object.values(ErrorCode)) {
    const message = new AppError(code).userMessage;
    assertEquals(message.includes('!'), false, `"${code}" copy must not use an exclamation mark`);
    assertEquals(message.length > 0, true, `"${code}" must have user-facing copy`);
  }
});

Deno.test('toAppError passes an AppError through unchanged', () => {
  const original = Errors.rateLimited();
  assertEquals(toAppError(original), original);
});

Deno.test('toAppError wraps a native Error as internal without leaking its message', () => {
  const converted = toAppError(new TypeError('cannot read property of undefined'));

  assertEquals(converted.code, ErrorCode.INTERNAL_ERROR);
  assertEquals(converted.toResponseBody().message.includes('cannot read property'), false);
  assertEquals(converted.details?.originalMessage, 'cannot read property of undefined');
});

Deno.test('toAppError handles non-Error throws', () => {
  const converted = toAppError('string failure');
  assertEquals(converted.code, ErrorCode.INTERNAL_ERROR);
  assertEquals(converted.details?.thrown, 'string failure');
});

Deno.test('AppError.is recognises instances across module boundaries', () => {
  assertEquals(AppError.is(Errors.notFound()), true);
  assertEquals(AppError.is(new Error('plain')), false);
  assertEquals(AppError.is(null), false);
});
