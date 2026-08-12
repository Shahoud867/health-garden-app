import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

/**
 * Deliberately standalone, not merged with vite.config.ts (Vitest supports
 * that via mergeConfig, but this project's vite.config.ts pulls in
 * Figma-Make-specific plugins meant for dev/build only -- pointless overhead
 * for a jsdom test run, and one fewer thing that can break unit tests for
 * reasons unrelated to the code under test).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    css: false,
    // lib/env.ts throws at import time if these are unset (by design). Set
    // here, not via a process.env mutation in setupFiles -- import.meta.env
    // is resolved once at config/module-graph load, before setupFiles run,
    // so a setup-file mutation would be too late for the first module that
    // imports env.ts. This is Vitest's own documented mechanism for exactly
    // this case.
    env: {
      VITE_SUPABASE_URL: "https://unit-test-placeholder.supabase.co",
      VITE_SUPABASE_ANON_KEY: "unit-test-placeholder-anon-key",
      // Not a real key -- push.test.ts never reaches real browser crypto
      // (pushManager.subscribe is mocked); this only needs to be a
      // syntactically valid base64url string so isPushSupported()'s
      // "configured" branch is actually exercisable in tests.
      VITE_VAPID_PUBLIC_KEY: "A".repeat(87),
    },
  },
})
