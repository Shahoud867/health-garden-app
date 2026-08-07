import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "error-callback"?: () => void
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js"
let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Turnstile"))
      document.head.appendChild(script)
    })
  }
  return scriptLoadPromise
}

/**
 * Cloudflare Turnstile widget (§7.12) — `payments-submit-intent` requires a
 * fresh token on every submission (bot protection on a public-facing form
 * with no app-store-listing friction, per that Edge Function's own header
 * comment). Site key is public by design (safe to ship in the bundle,
 * unlike the secret key the Edge Function verifies it against
 * server-side) — see `.env.example` / README for where to get one.
 */
export function Turnstile({
  onToken,
  siteKey,
}: {
  onToken: (token: string) => void
  siteKey: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onToken,
        })
      })
      .catch(() => {
        // Widget simply never renders; the submit button stays disabled
        // (no token ever arrives) rather than throwing mid-render.
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onToken is
    // expected to be stable per mount; re-running on every parent render
    // would tear down and re-render the widget needlessly.
  }, [siteKey])

  return <div ref={containerRef} />
}
