import { useCallback, useEffect, useState } from "react"
import type { Screen } from "../types"
import { pathForScreen, screenForPath } from "../lib/router"

/**
 * Drop-in replacement for `useState<Screen>("landing")` + a plain
 * `navigate` closure — same two return values, same call shape at every
 * existing `navigate("home")`-style call site — but now backed by a real
 * URL: bookmarkable, shareable, and correct on the browser's back/forward
 * buttons, none of which a bare `useState` could ever be.
 */
export function useScreenRouter(): {
  screen: Screen
  navigate: (s: Screen) => void
} {
  const [screen, setScreen] = useState<Screen>(() =>
    screenForPath(window.location.pathname),
  )

  useEffect(() => {
    const onPopState = () => setScreen(screenForPath(window.location.pathname))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = useCallback((s: Screen) => {
    const path = pathForScreen(s)
    // Same-path navigations (e.g. two screens sharing "/") shouldn't push a
    // new, indistinguishable history entry the back button would then have
    // to click through twice for one visible change.
    if (path !== window.location.pathname) {
      window.history.pushState(null, "", path)
    }
    setScreen(s)
  }, [])

  return { screen, navigate }
}
