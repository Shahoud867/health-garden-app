import { assertEquals, assertThrows } from '@std/assert';
import { ConfigurationError, createConfig, type EnvSource } from './env.ts';

function envFrom(values: Record<string, string | undefined>): EnvSource {
  return { get: (key) => values[key] };
}

const COMPLETE_ENV: Record<string, string> = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  APP_ENV: 'local',
};

Deno.test('createConfig parses a complete environment', () => {
  const config = createConfig(envFrom(COMPLETE_ENV));

  assertEquals(config.supabaseUrl, 'http://127.0.0.1:54321');
  assertEquals(config.environment, 'local');
  assertEquals(config.isProduction, false);
});

Deno.test('createConfig trims surrounding whitespace', () => {
  const config = createConfig(envFrom({ ...COMPLETE_ENV, SUPABASE_URL: '  http://x  ' }));
  assertEquals(config.supabaseUrl, 'http://x');
});

Deno.test('createConfig fails fast when a required variable is missing', () => {
  const { SUPABASE_SERVICE_ROLE_KEY: _omitted, ...incomplete } = COMPLETE_ENV;

  const error = assertThrows(() => createConfig(envFrom(incomplete)), ConfigurationError);
  // The message must name the variable — a config failure at cold start should
  // be self-diagnosing rather than requiring a code read.
  assertEquals(error.message.includes('SUPABASE_SERVICE_ROLE_KEY'), true);
});

Deno.test('createConfig treats an empty string as missing', () => {
  assertThrows(
    () => createConfig(envFrom({ ...COMPLETE_ENV, SUPABASE_ANON_KEY: '   ' })),
    ConfigurationError,
  );
});

Deno.test('createConfig rejects an unknown environment name', () => {
  assertThrows(
    () => createConfig(envFrom({ ...COMPLETE_ENV, APP_ENV: 'prod' })),
    ConfigurationError,
    'Invalid APP_ENV',
  );
});

Deno.test('createConfig defaults APP_ENV to local when absent', () => {
  const { APP_ENV: _omitted, ...withoutEnv } = COMPLETE_ENV;
  assertEquals(createConfig(envFrom(withoutEnv)).environment, 'local');
});

Deno.test('log level defaults to info in production and debug elsewhere', () => {
  assertEquals(createConfig(envFrom({ ...COMPLETE_ENV, APP_ENV: 'production' })).logLevel, 'info');
  assertEquals(createConfig(envFrom({ ...COMPLETE_ENV, APP_ENV: 'staging' })).logLevel, 'debug');
});

Deno.test('explicit LOG_LEVEL overrides the environment default', () => {
  const config = createConfig(
    envFrom({ ...COMPLETE_ENV, APP_ENV: 'production', LOG_LEVEL: 'warn' }),
  );
  assertEquals(config.logLevel, 'warn');
});

Deno.test('createConfig rejects an unknown log level', () => {
  assertThrows(
    () => createConfig(envFrom({ ...COMPLETE_ENV, LOG_LEVEL: 'verbose' })),
    ConfigurationError,
    'Invalid LOG_LEVEL',
  );
});

Deno.test('isProduction is set only for the production environment', () => {
  assertEquals(
    createConfig(envFrom({ ...COMPLETE_ENV, APP_ENV: 'production' })).isProduction,
    true,
  );
  assertEquals(createConfig(envFrom({ ...COMPLETE_ENV, APP_ENV: 'staging' })).isProduction, false);
});
