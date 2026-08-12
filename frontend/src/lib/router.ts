import type { Screen } from "../types"

/**
 * URL-per-screen mapping — pure data/functions, no History API calls here
 * (that's `hooks/useScreenRouter.ts`), so this half is trivially unit-testable
 * and the source of truth both directions read from.
 *
 * This app deliberately has no router *library* (see the blueprint's own
 * note in App.tsx's original design: "one screen state variable... matching
 * the original design's simplicity rather than introducing React Router for
 * its own sake") — every route here is a flat, parameter-free screen, so a
 * hand-rolled two-way map over the History API is the whole problem, not a
 * reason to add a dependency.
 *
 * `landing` and `home` share `/` on purpose: which one actually renders for
 * a bare `/` is already decided by auth state (App.tsx's own redirect
 * effect), exactly like the pre-router `useState<Screen>("landing")` default
 * always was — the reverse map below resolves `/` to `landing`, and that
 * effect promotes it to `home` the instant a session is found, same as
 * before.
 */
const SCREEN_TO_PATH: Record<Screen, string> = {
  landing: "/",
  home: "/",
  pricing: "/pricing",
  login: "/login",
  signup: "/signup",
  "forgot-password": "/forgot-password",
  "email-verify": "/verify-email",
  onboarding: "/onboarding",
  food: "/food",
  workout: "/workout",
  water: "/water",
  weight: "/weight",
  garden: "/garden",
  "garden-history": "/garden/history",
  "ai-coach": "/coach",
  "ai-plan": "/plan",
  premium: "/premium",
  profile: "/profile",
  privacy: "/privacy",
  terms: "/terms",
  about: "/about",
}

const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  Object.entries(SCREEN_TO_PATH)
    .filter(([screen]) => screen !== "home") // "/" -> landing, not home; see doc comment
    .map(([screen, path]) => [path, screen as Screen]),
)

export function pathForScreen(screen: Screen): string {
  return SCREEN_TO_PATH[screen]
}

/** Unknown/stale paths fall back to `landing` -- the same default the app
 * always booted to before any URL was meaningful, not a broken/blank state. */
export function screenForPath(pathname: string): Screen {
  return PATH_TO_SCREEN[pathname] ?? "landing"
}
