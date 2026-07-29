/**
 * Conventional Commits enforcement (Blueprint §13.4).
 *
 * A greppable history is disproportionately valuable for a two-person team
 * where losing shared context is the real long-term risk (Blueprint §14.2).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'kernel', // shared Edge Function runtime
        'db', // migrations, schema, RLS policies
        'auth', // authentication & authorization
        'tracker', // food / workout / water / weight logging
        'garden', // garden mechanic
        'ai', // Gemini integration & cost control
        'payments', // subscriptions & payment intents
        'jobs', // pg_cron & background processing
        'obs', // logging, monitoring, RUM
        'security', // headers, CSP, bot protection, AI hardening
        'web', // Next.js client (Phase 5+)
        'ci', // pipelines & automation
        'docs', // documentation & ADRs
        'deps', // dependency changes
        'config', // tooling & project configuration
      ],
    ],
    'body-max-line-length': [1, 'always', 100],
  },
};
