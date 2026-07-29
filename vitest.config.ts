import { defineConfig } from 'vitest/config';

// Scoped to the database-layer suite for now (Phase 3). A client-side config
// covering src/ arrives with the web app (Phase 3 of the blueprint's own
// roadmap, §13.2) — kept separate rather than one growing config, since the
// two suites have nothing in common but the test runner.
export default defineConfig({
  test: {
    include: ['supabase/tests/database/**/*.test.ts'],
    // These are integration tests against one shared local Postgres instance,
    // not pure unit tests -- running test files sequentially avoids reasoning
    // about cross-file interleaving on tables a global sweep (
    // archive_and_reset_stale_garden_rows) scans across every user.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
