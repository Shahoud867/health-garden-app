/**
 * Registers `public/sw.js` (offline app-shell caching + Web Push receipt --
 * see that file's own doc comment). Called once from `main.tsx`, fire-and-
 * forget: a failed registration (unsupported browser, dev server quirks)
 * should never block the app from rendering, so this never throws outward.
 */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Genuinely non-fatal: the app works without it, just without offline
      // shell caching or push notifications. Logged for visibility, not
      // surfaced to the user -- there's no action they could take about it.
      console.warn("Service worker registration failed:", err)
    })
  })
}
