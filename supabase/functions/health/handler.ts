/**
 * Liveness probe handler (Blueprint §6.2, §10.2).
 *
 * Separated from `index.ts` so the handler can be imported and exercised by
 * tests without `Deno.serve` binding a port as an import side effect. Every
 * function in this project follows the same split: `handler.ts` holds logic,
 * `index.ts` is the runtime entrypoint and contains nothing else.
 *
 * Scope is deliberately narrow: prove the Edge Runtime boots, configuration
 * parses, and the kernel can serve a response. No database round-trip — a
 * liveness probe that queries Postgres conflates "the function is up" with "the
 * database is reachable", producing alerts that cannot be acted on without
 * further investigation. Database health is already surfaced by the Supabase
 * dashboard (Blueprint §10.2).
 *
 * Public by design: `verify_jwt = false` in config.toml, since a monitor holds
 * no user credentials.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { API_VERSION } from '../_shared/version.ts';

export interface HealthResponse {
  readonly status: 'ok';
  readonly service: 'health-garden';
  readonly apiVersion: string;
  readonly environment: string;
  readonly timestamp: string;
}

export const handleHealth = defineEndpoint({
  name: 'health',
  methods: ['GET'],
  auth: 'none',
  handler: (ctx): HealthResponse => ({
    status: 'ok',
    service: 'health-garden',
    apiVersion: API_VERSION,
    // Safe to expose: names the deployment tier, not any secret, and makes
    // "which environment did I just probe?" answerable without guessing.
    environment: ctx.config.environment,
    timestamp: new Date().toISOString(),
  }),
});
