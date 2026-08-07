import { defineConfig, devices } from '@playwright/test'

/**
 * Runs against a real Supabase stack (local, via `supabase start` -- same
 * pattern as the backend's own `database` CI job, Blueprint §13.5's
 * reasoning applied here too: this is where a frontend/backend contract
 * mismatch actually gets caught, not in a mocked unit test). Needs
 * VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY set before running --
 * `npx supabase status -o env` after `npm run db:start` at the repo root.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8443',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Starts the dev server itself unless one is already running at baseURL
  // (e.g. a developer's own `npm run dev`) -- CI always starts fresh.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8443',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
