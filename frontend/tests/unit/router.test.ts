import { describe, expect, it } from "vitest"
import { pathForScreen, screenForPath } from "../../src/lib/router"
import type { Screen } from "../../src/types"

const ALL_SCREENS: Screen[] = [
  "landing",
  "pricing",
  "login",
  "signup",
  "forgot-password",
  "email-verify",
  "onboarding",
  "home",
  "food",
  "workout",
  "water",
  "weight",
  "garden",
  "garden-history",
  "ai-coach",
  "ai-plan",
  "premium",
  "profile",
  "privacy",
  "terms",
  "about",
]

describe("lib/router", () => {
  it("gives every screen a path", () => {
    for (const screen of ALL_SCREENS) {
      expect(typeof pathForScreen(screen)).toBe("string")
      expect(pathForScreen(screen).startsWith("/")).toBe(true)
    }
  })

  it('round-trips every screen except home (which shares "/" with landing by design)', () => {
    for (const screen of ALL_SCREENS) {
      if (screen === "home") continue
      expect(screenForPath(pathForScreen(screen))).toBe(screen)
    }
  })

  it('resolves "/" to landing, not home -- auth state promotes it from there, same as the pre-router default', () => {
    expect(screenForPath("/")).toBe("landing")
    expect(pathForScreen("home")).toBe("/")
  })

  it("falls back to landing for an unknown path instead of throwing or returning undefined", () => {
    expect(screenForPath("/this-was-never-a-real-route")).toBe("landing")
  })
})
