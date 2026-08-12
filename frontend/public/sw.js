/**
 * Health Garden's service worker: two jobs, kept deliberately separate.
 *
 * 1. Offline app-shell caching — runtime cache-as-you-go for same-origin
 *    static assets (the hashed JS/CSS Vite emits, icons, the manifest), so a
 *    dropped connection still opens the app shell instead of a blank tab.
 *    Never caches cross-origin requests (Supabase's REST/Auth/Functions API,
 *    on a different origin than this app) -- that's real, live, per-user
 *    data; caching it here would mean showing stale or wrong-user data
 *    instead of the network error the app's own `withTimeout`/error-toast
 *    handling already knows how to surface correctly.
 *
 * 2. Web Push receipt -- the client half of `notify-inactive-users` (backend,
 *    already built: real VAPID push, restrained non-manipulative copy). A
 *    push subscription is useless without something to receive `push`
 *    events and turn them into a real system notification; this is that.
 */

const SHELL_CACHE = "health-garden-shell-v1"

self.addEventListener("install", (event) => {
  // Activate immediately rather than waiting for every open tab to close --
  // this is a PWA shell-cache/push worker, not something with a migration
  // that could break an in-flight page.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith("health-garden-") && name !== SHELL_CACHE)
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never touch Supabase/API calls

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      try {
        const fresh = await fetch(request)
        // Only cache real, complete responses -- an opaque/error response
        // cached here would be replayed as "success" on the next offline hit.
        if (fresh.ok) cache.put(request, fresh.clone())
        return fresh
      } catch (err) {
        const cached = await cache.match(request)
        if (cached) return cached
        // Navigations (e.g. a fresh tab opened offline) fall back to the
        // shell itself if it's cached, so the app boots instead of the
        // browser's own offline error page.
        if (request.mode === "navigate") {
          const shell = await cache.match("/")
          if (shell) return shell
        }
        throw err
      }
    })(),
  )
})

self.addEventListener("push", (event) => {
  /** notify-inactive-users (Edge Function) sends `{ body }` today -- no
   * title, since the restrained copy this app deliberately ships (see the
   * handler's own doc comment) is one line, not a headline. Everything else
   * here is this worker's own presentation choice, not the payload's. */
  let payload = { body: "Your garden's still waiting for today's log." }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    // Not JSON (unexpected, but shouldn't crash notification display) --
    // fall back to the default body above.
  }

  event.waitUntil(
    self.registration.showNotification("Health Garden", {
      body: payload.body,
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-192.png",
      tag: "engagement-nudge", // a second nudge replaces, not stacks
      data: { url: payload.url || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || "/"

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      const existing = allClients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        await existing.focus()
        if ("navigate" in existing) await existing.navigate(targetUrl)
        return
      }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})
