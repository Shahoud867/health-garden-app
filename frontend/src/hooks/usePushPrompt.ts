import { useEffect, useState } from "react"
import { isPushSupported, enablePushNotifications } from "../lib/push"
import { useToast } from "./useToast"
import type { Lang } from "../types"

const DISMISSED_KEY = "hg_push_prompt_dismissed"

/**
 * Decides when to offer "enable reminders," and does the offering — not a
 * blind auto-prompt on page load. `Notification.requestPermission()` needs a
 * real user gesture to work reliably across browsers anyway, and asking
 * before someone has gotten any value from the app is exactly the kind of
 * thing the garden mechanic's own restrained, non-manipulative design
 * (see notify-inactive-users' doc comment) argues against.
 *
 * Shows once a user has logged *something* today (proof the core loop
 * already landed for them), never again after they've answered either way
 * (localStorage-sticky — respecting "no" permanently, not re-asking on
 * every visit).
 */
export function usePushPrompt(
  hasLoggedToday: boolean,
  userId: string,
  lang: Lang,
): {
  visible: boolean
  enabling: boolean
  enable: () => void
  dismiss: () => void
} {
  const { showToast } = useToast()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1",
  )
  const [enabling, setEnabling] = useState(false)
  const [permissionState, setPermissionState] =
    useState<NotificationPermission | null>(() =>
      typeof Notification !== "undefined" ? Notification.permission : null,
    )

  // Notification.permission can change outside this component (browser
  // settings UI) -- re-check on focus so a stale "still default" doesn't
  // keep the banner showing after the user granted/blocked it elsewhere.
  useEffect(() => {
    const recheck = () => {
      if (typeof Notification !== "undefined")
        setPermissionState(Notification.permission)
    }
    window.addEventListener("focus", recheck)
    return () => window.removeEventListener("focus", recheck)
  }, [])

  const visible =
    hasLoggedToday &&
    !dismissed &&
    isPushSupported() &&
    permissionState === "default" &&
    Boolean(userId)

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setDismissed(true)
  }

  const enable = () => {
    setEnabling(true)
    enablePushNotifications(userId)
      .then((outcome) => {
        if (outcome === "granted") {
          showToast(
            lang === "ur" ? "یاد دہانیاں فعال ہو گئیں۔" : "Reminders enabled.",
            "success",
          )
        }
        // "denied" and "unsupported" aren't errors to surface -- the user
        // made a real choice, or their browser doesn't support this; either
        // way there's nothing actionable to tell them.
      })
      .catch((err) => {
        showToast(
          err instanceof Error ? err.message : "Could not enable reminders.",
          "error",
        )
      })
      .finally(() => {
        setEnabling(false)
        dismiss() // asked and answered either way -- never nag again
        setPermissionState(
          typeof Notification !== "undefined" ? Notification.permission : null,
        )
      })
  }

  return { visible, enabling, enable, dismiss }
}
