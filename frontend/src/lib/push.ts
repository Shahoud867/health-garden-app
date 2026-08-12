import { supabase } from "./supabase"
import { normalizeError } from "./errors"
import { withTimeout, QUERY_TIMEOUT_MS } from "./timeout"
import { env } from "./env"

/**
 * The client half of Web Push (§2.8/§4.6, ADR-019) — `notify-inactive-users`
 * (Edge Function) and `public/sw.js` (this app's own service worker, which
 * receives the `push` event) already exist; this is what actually creates a
 * `push_tokens` row for a real subscriber, the one piece that was missing.
 *
 * RLS ("Users manage own push tokens", migration 0009) already scopes
 * `push_tokens` to the owning row's `user_id`, so this writes directly via
 * PostgREST — no Edge Function needed, same as every other `lib/api/*` call.
 */

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(env.vapidPublicKey)
  )
}

/** The Push API wants a raw `Uint8Array` applicationServerKey, not the
 * base64url string VAPID keys are normally generated/shared as. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  // Explicit ArrayBuffer (not the wider ArrayBufferLike a bare `new
  // Uint8Array(length)` infers under TS 5.7's DOM lib) -- PushManager's
  // applicationServerKey wants exactly this, not the SharedArrayBuffer-
  // compatible supertype.
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/**
 * Requests notification permission (must be called from a real user
 * gesture — a click handler, not on page load — or most browsers silently
 * ignore it), then subscribes to Push and writes the subscription to
 * `push_tokens`. Returns the outcome rather than throwing on a denied
 * permission, since "the user said no" isn't an error condition the caller
 * needs to catch differently from "it worked."
 */
export async function enablePushNotifications(
  userId: string,
): Promise<"granted" | "denied" | "unsupported"> {
  if (!isPushSupported() || !env.vapidPublicKey) return "unsupported"

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return "denied"

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey),
  })
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    // Malformed subscription (shouldn't happen per the Push API spec, but
    // this is exactly the kind of external-API assumption worth a real
    // check rather than a silent `!` cast into the insert below).
    throw new Error("Push subscription did not return the expected shape.")
  }

  const { error } = await withTimeout(
    supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" },
    ),
    QUERY_TIMEOUT_MS,
    "Could not save your notification settings — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)

  return "granted"
}

/** Best-effort cleanup on logout/disable — a stale subscription is
 * otherwise pruned server-side (404/410 handling in notify-inactive-users)
 * but there's no reason to wait for that when the user is right here. */
export async function disablePushNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()

  const { error } = await withTimeout(
    supabase.from("push_tokens").delete().eq("endpoint", endpoint),
    QUERY_TIMEOUT_MS,
    "Could not update your notification settings — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
}
