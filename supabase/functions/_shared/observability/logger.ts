/**
 * Structured, PII-redacting logger (Blueprint §10.1, §7.9).
 *
 * Emits one JSON object per line to stdout, which the Supabase platform
 * collects — no log-shipping agent to operate (Blueprint NFR-7).
 *
 * The redaction layer is not decorative. This system stores diagnosed medical
 * conditions, body weight, and food intake (Blueprint NFR-6). Logs are read by
 * humans, retained by a third-party platform, and pasted into issue trackers
 * during debugging; treating them as a place sensitive fields can safely appear
 * would quietly defeat the data-minimisation posture of §7.9. The deny-list is
 * therefore enforced centrally rather than left to each call site's discretion.
 *
 * Redaction, merging, and serialisation all happen inside one try/catch: a
 * throwing getter or a cyclic structure in the caller-supplied context must
 * never be the thing that fails a request — it should degrade to a minimal,
 * still-safe record instead.
 */

import type { LogLevel } from '../config/env.ts';

/** Structured fields attached to a log record. */
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a logger that merges `context` into every subsequent record. */
  child(context: LogContext): Logger;
}

/** Sink abstraction — injected so tests can capture output without stdout. */
export interface LogSink {
  write(line: string): void;
}

const LEVEL_SEVERITY: Readonly<Record<LogLevel, number>> = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

/**
 * Field names whose values are never written to logs.
 *
 * Matching is case-insensitive and substring-based so that near-miss variants
 * (`user_email`, `emailAddress`) are caught without needing exhaustive listing.
 */
const REDACTED_KEY_PATTERNS: readonly string[] = [
  // Credentials and secrets
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'jwt',
  'session',
  // Direct identifiers
  'email',
  'phone',
  'full_name',
  'fullname',
  'avatar',
  // Health and body data (Blueprint NFR-6)
  'condition',
  'weight',
  'height',
  'symptom',
  'severity',
  'diagnosis',
  'bmr',
  'notes',
  // Financial
  'card',
  'cvv',
  'account_number',
];

const REDACTED_PLACEHOLDER = '[redacted]';

/** Depth limit guards against unbounded recursion on cyclic structures. */
const MAX_REDACTION_DEPTH = 6;

/** Strings longer than this are truncated to keep log lines bounded. */
const MAX_STRING_LENGTH = 512;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return REDACTED_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated ${value.length - MAX_STRING_LENGTH}]`;
}

/**
 * Recursively replaces values under sensitive keys with a placeholder.
 *
 * Exported for direct testing: redaction correctness is a security property, so
 * it is verified in isolation rather than only through the logger's output.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_REDACTION_DEPTH) return '[max-depth]';

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return truncate(value);

  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (typeof value === 'bigint') return value.toString();

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
      stack: value.stack === undefined ? undefined : truncate(value.stack),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED_PLACEHOLDER : redact(nested, depth + 1);
    }
    return result;
  }

  // Functions, symbols, and anything else are intentionally not serialised.
  return '[unserializable]';
}

/** The default sink: one JSON line per record on stdout. */
export const stdoutSink: LogSink = {
  write: (line: string): void => {
    // deno-lint-ignore no-console
    console.log(line);
  },
};

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly sink?: LogSink;
  readonly baseContext?: LogContext;
  /** Injectable clock — keeps emitted timestamps deterministic under test. */
  readonly now?: () => Date;
}

/**
 * Creates a structured logger.
 *
 * Records below the configured level are dropped before serialisation, so
 * disabled `debug` calls cost approximately nothing on hot paths.
 */
export function createLogger(options: LoggerOptions): Logger {
  const { level, sink = stdoutSink, baseContext = {}, now = () => new Date() } = options;
  const threshold = LEVEL_SEVERITY[level];

  function emit(recordLevel: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_SEVERITY[recordLevel] < threshold) return;

    const timestamp = now().toISOString();
    const safeMessage = truncate(message);

    try {
      // Merging, redaction, and serialisation are all inside the boundary.
      // Every one of them can throw on hostile input — a property with a
      // throwing getter breaks the spread, a cyclic graph breaks stringify —
      // and a diagnostic call must never be the thing that fails a request.
      const merged: LogContext = { ...baseContext, ...(context ?? {}) };
      const record = {
        level: recordLevel,
        time: timestamp,
        message: safeMessage,
        ...(redact(merged) as LogContext),
      };
      sink.write(JSON.stringify(record));
    } catch {
      // Fall back to a minimal record built only from values already proven
      // safe above, so the event is still observable even when its context
      // is not.
      sink.write(
        JSON.stringify({
          level: recordLevel,
          time: timestamp,
          message: safeMessage,
          logging_error: 'context_serialization_failed',
        }),
      );
    }
  }

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),
    child: (context) =>
      createLogger({ level, sink, baseContext: { ...baseContext, ...context }, now }),
  };
}
