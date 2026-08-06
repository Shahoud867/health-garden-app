import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * ESLint governs Node-side tooling files only.
 *
 * Edge Function sources under `supabase/functions/` are linted by `deno lint`
 * (see deno.json) because they target the Deno runtime, not Node. Running two
 * linters over the same files produces contradictory diagnostics, so ownership
 * is split cleanly by directory. Once the Next.js web client exists (Phase 5+),
 * it is also linted by this config, since it is a Node-toolchain project.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.coverage/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'supabase/functions/**',
      'supabase/.temp/**',
      // The web client is a browser-targeted Vite/React project with its own
      // toolchain and globals. This config only sets Node globals, so it would
      // misflag every browser API there; `frontend` typechecks itself via
      // `npm run typecheck --prefix frontend`. Same directory split as Deno.
      'frontend/**',
      // Locally-installed editor/agent tooling, never project source.
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
