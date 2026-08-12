/**
 * Typed, validated access to build-time environment variables.
 *
 * Vite only exposes `VITE_`-prefixed variables to client code (see
 * `.env.example`) — reading `import.meta.env` directly anywhere else in the
 * app risks a silent `undefined` reaching a `fetch` call as the literal
 * string "undefined" in a URL. Failing loudly here, once, at import time is
 * cheaper to debug than a mysterious network error three screens deep.
 */

interface AppEnv {
  supabaseUrl: string
  supabaseAnonKey: string
  /** Undefined until a real site key is configured — the Premium/pricing
   *  screens degrade to "payments temporarily unavailable" rather than the
   *  whole app failing to boot (unlike the two Supabase values below, every
   *  screen needs those). */
  turnstileSiteKey: string | undefined
  /** Undefined until a real VAPID key pair is generated (`.env.example`'s
   *  root-level comment: "PUBLIC key ships to the web client's
   *  push-subscription call"). The public half only, matching the pair's own
   *  design — safe to expose, it can't sign anything, only identify which
   *  server is allowed to push to a subscription. Push-enable UI degrades to
   *  not offering the option at all rather than the app failing to boot. */
  vapidPublicKey: string | undefined
  /** Same key the backend's POSTHOG_API_KEY uses (Blueprint ADR-013) --
   *  undefined until a real PostHog project exists. See
   *  lib/observability/posthog.ts: degrades to a silent no-op, not a boot
   *  failure. */
  posthogApiKey: string | undefined
  posthogHost: string
  /** Same DSN the backend's SENTRY_DSN uses. See
   *  lib/observability/sentry.ts: degrades to a silent no-op, not a boot
   *  failure. */
  sentryDsn: string | undefined
}

function readEnv(): AppEnv {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined
  const posthogApiKey = import.meta.env.VITE_POSTHOG_API_KEY || undefined
  const posthogHost =
    import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || undefined

  const missing: string[] = []
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL")
  if (!supabaseAnonKey) missing.push("VITE_SUPABASE_ANON_KEY")

  if (missing.length > 0) {
    // Thrown, not logged: every API call in this app goes through the
    // Supabase client, so a missing config value must stop the app at boot
    // with a clear cause rather than surface as unrelated failures per
    // screen. See ErrorBoundary, which renders this message directly.
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy frontend/.env.example to frontend/.env.local and fill in your Supabase project values.",
    )
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    turnstileSiteKey,
    vapidPublicKey,
    posthogApiKey,
    posthogHost,
    sentryDsn,
  }
}

export const env: AppEnv = readEnv()
