/**
 * Validated runtime configuration (Blueprint §7.4, §9.4).
 *
 * Design intent: fail fast and loudly at cold start rather than at the moment a
 * missing variable is first dereferenced. A function that boots successfully is
 * then guaranteed to hold a complete, well-typed configuration — no defensive
 * `?? ''` fallbacks scattered through business logic.
 *
 * The environment source is injected rather than read directly from `Deno.env`,
 * so configuration parsing is unit-testable without mutating process state.
 */

/** Deployment environments (Blueprint §9.1). */
export type AppEnvironment = 'local' | 'development' | 'staging' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** A read-only view over environment variables. */
export interface EnvSource {
  get(key: string): string | undefined;
}

export interface AppConfig {
  /** Supabase project URL. PUBLIC — safe to embed in a client. */
  readonly supabaseUrl: string;
  /** Anon key. PUBLIC — access is constrained by RLS (Blueprint ADR-006). */
  readonly supabaseAnonKey: string;
  /**
   * Service-role key. SECRET — bypasses every RLS policy.
   * Only ever read inside an Edge Function; never returned in a response.
   */
  readonly supabaseServiceRoleKey: string;
  readonly environment: AppEnvironment;
  readonly logLevel: LogLevel;
  /** True for environments where verbose diagnostics are safe to emit. */
  readonly isProduction: boolean;
}

/** Raised when configuration is absent or malformed at cold start. */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const VALID_ENVIRONMENTS: readonly AppEnvironment[] = [
  'local',
  'development',
  'staging',
  'production',
];

const VALID_LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

function requireString(source: EnvSource, key: string): string {
  const value = source.get(key);
  if (value === undefined || value.trim() === '') {
    throw new ConfigurationError(
      `Missing required environment variable "${key}". ` +
        `Set it via \`supabase secrets set\` for deployed environments, or in ` +
        `supabase/functions/.env.local for local development.`,
    );
  }
  return value.trim();
}

function parseEnvironment(raw: string | undefined): AppEnvironment {
  const value = (raw ?? 'local').trim().toLowerCase();
  if (!VALID_ENVIRONMENTS.includes(value as AppEnvironment)) {
    throw new ConfigurationError(
      `Invalid APP_ENV "${value}". Expected one of: ${VALID_ENVIRONMENTS.join(', ')}.`,
    );
  }
  return value as AppEnvironment;
}

function parseLogLevel(raw: string | undefined, environment: AppEnvironment): LogLevel {
  if (raw === undefined || raw.trim() === '') {
    // Production defaults to `info`: `debug` risks writing user-identifying
    // context into logs at volume (Blueprint §7.9 data minimisation).
    return environment === 'production' ? 'info' : 'debug';
  }
  const value = raw.trim().toLowerCase();
  if (!VALID_LOG_LEVELS.includes(value as LogLevel)) {
    throw new ConfigurationError(
      `Invalid LOG_LEVEL "${value}". Expected one of: ${VALID_LOG_LEVELS.join(', ')}.`,
    );
  }
  return value as LogLevel;
}

/**
 * Builds and validates configuration from an environment source.
 *
 * @throws {ConfigurationError} if any required variable is missing or invalid.
 */
export function createConfig(source: EnvSource): AppConfig {
  const environment = parseEnvironment(source.get('APP_ENV'));

  return Object.freeze({
    supabaseUrl: requireString(source, 'SUPABASE_URL'),
    supabaseAnonKey: requireString(source, 'SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: requireString(source, 'SUPABASE_SERVICE_ROLE_KEY'),
    environment,
    logLevel: parseLogLevel(source.get('LOG_LEVEL'), environment),
    isProduction: environment === 'production',
  });
}

/** The ambient Deno environment, adapted to {@link EnvSource}. */
export const denoEnvSource: EnvSource = {
  get: (key: string): string | undefined => Deno.env.get(key),
};

let cachedConfig: AppConfig | null = null;

/**
 * Returns the process-wide configuration, parsing it on first access.
 *
 * Cached because an Edge Function isolate may serve many requests; re-parsing
 * per request would be wasted work on a latency-budgeted path (Blueprint NFR-10).
 */
export function getConfig(): AppConfig {
  if (cachedConfig === null) {
    cachedConfig = createConfig(denoEnvSource);
  }
  return cachedConfig;
}

/** Test-only hook to clear the memoised configuration between cases. */
export function resetConfigCache(): void {
  cachedConfig = null;
}
