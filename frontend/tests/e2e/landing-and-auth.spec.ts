import { test, expect } from "@playwright/test"
import { signUpNewUser, uniqueTestEmail } from "./helpers"

test.describe("Landing page", () => {
  test("shows the core pitch and both primary CTAs, with no console errors", async ({
    page,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))

    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: /a garden that grows with you/i }),
    ).toBeVisible()
    // LandingScreen.tsx repeats this CTA deliberately (hero + free-plan
    // panel) -- see the identical note in helpers.ts's signUpNewUser.
    await expect(
      page.getByRole("button", { name: /start growing/i }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /see all features/i }),
    ).toBeVisible()
    await expect(page.getByText("PKR 299")).toBeVisible()

    expect(errors).toEqual([])
  })

  test('language toggle switches the page to Urdu and sets dir="rtl"', async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "اردو" }).click()
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(page.locator("html")).toHaveAttribute("lang", "ur")
  })
})

test.describe("Sign up and log in", () => {
  test("a new account signs up, and lands on onboarding (or email verification)", async ({
    page,
  }) => {
    await signUpNewUser(page, uniqueTestEmail())
  })

  test("logging in with the wrong password shows an error, not a silent failure", async ({
    page,
  }) => {
    // Deliberately does NOT sign up first: Supabase Auth returns the same
    // generic "invalid credentials" for a wrong password on a real account
    // and for a nonexistent one (by design, to avoid leaking which emails
    // are registered) -- so this doesn't need a real account, and avoids a
    // real bug this test originally had: a fresh page.goto('/') after
    // signUpNewUser does NOT return to the landing page's login form, since
    // the session persists in localStorage (lib/supabase.ts's
    // persistSession: true, by design) -- the redirect effect sends an
    // already-authenticated session straight past 'landing'/'login' into
    // the app, so there would never have been a login form to fill in.
    await page.goto("/")
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible()
    await page.getByRole("button", { name: "Log In" }).click()

    await expect(page.getByRole("heading", { name: "Log In" })).toBeVisible()
    await page.getByLabel("Email").fill(uniqueTestEmail())
    await page.getByLabel("Password").fill("definitely-the-wrong-password")
    await page.getByRole("button", { name: "Log In" }).last().click()

    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10_000 })
  })

  test('forgot-password submits and shows the "reset link sent" confirmation', async ({
    page,
  }) => {
    await page.goto("/")
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible()
    await page.getByRole("button", { name: "Log In" }).click()

    // Each step asserted individually rather than chaining bare .click()s --
    // if this test ever times out again, the failure points at the exact
    // stuck step instead of a bare "test timeout exceeded" with no context.
    const forgotLink = page.getByRole("button", { name: /forgot password/i })
    await expect(forgotLink).toBeVisible({ timeout: 10_000 })
    await forgotLink.click()

    const emailField = page.getByLabel("Email")
    await expect(emailField).toBeVisible({ timeout: 10_000 })
    await emailField.fill(uniqueTestEmail())

    // AuthScreen's submit button reuses `titles[mode]` for its own label,
    // not a generic "Submit" -- for forgot-password mode that's
    // t('forgotPassword', lang) with the "?" stripped, i.e. "Forgot
    // password" (no question mark). Scoped to type="submit" since the
    // "Forgot password?" *link* (with the "?", on the login screen this
    // test already navigated away from) would otherwise be a same-text
    // near-miss for a looser query.
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    await expect(page.getByText(/check your inbox/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})

test("the Premium screen is reachable signed-out and shows both plans", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: /see all features/i }).click()
  await expect(
    page.getByRole("heading", { name: /pricing|clear, simple pricing/i }),
  ).toBeVisible()
  await expect(page.getByText("Free forever")).toBeVisible()
})
