import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Real WCAG scans against real rendered pages -- the audit's own
 * recommendation ("near-zero new infrastructure needed" against the
 * existing E2E suite's pages) applied literally. Every rule runs except
 * `color-contrast`, deliberately: a direct luminance-ratio check against
 * this app's real palette found genuine gaps (§SectionLabel text --
 * #8b6f46 on #fff8ee -- measures 4.46:1, just under the 4.5:1 AA floor for
 * normal-size text; the #d96d20 accent used for small text measures
 * 3.41:1, clearly under). Both are real findings, recorded here rather
 * than silently dropped -- but recoloring a brand palette is a design
 * decision, not a markup fix, and not something to make unilaterally
 * without whoever owns that palette weighing in. Every other WCAG rule
 * here (labels, ARIA, landmarks, alt text, form structure) *is* a markup
 * fix, and stays strictly enforced.
 */

test.describe("Accessibility (WCAG, excluding color-contrast)", () => {
  test("landing page has no structural accessibility violations", async ({
    page,
  }) => {
    await page.goto("/")
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("login screen has no structural accessibility violations", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Log In" }).click()
    await expect(page.getByRole("heading", { name: "Log In" })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("signup screen has no structural accessibility violations", async ({
    page,
  }) => {
    await page.goto("/")
    await page
      .getByRole("button", { name: /start growing/i })
      .first()
      .click()
    await expect(page.getByLabel("Full Name")).toBeVisible()

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("pricing screen has no structural accessibility violations", async ({
    page,
  }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /see all features/i }).click()
    await expect(page.getByText("Free forever")).toBeVisible()

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe("Keyboard navigation", () => {
  test("the login form is fully operable with no mouse", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Log In" }).click()
    await expect(page.getByRole("heading", { name: "Log In" })).toBeVisible()

    // Tab order should reach both fields and the submit button without a
    // click -- proves the form's real DOM order is usable, not just that
    // labels exist (axe checks the label association; this checks the
    // actual tab sequence works).
    await page.getByLabel("Email").focus()
    await page.keyboard.type("keyboard-nav-check@example.test")
    await page.keyboard.press("Tab")
    await expect(page.getByLabel("Password")).toBeFocused()
    await page.keyboard.type("irrelevant-password")

    // Submitting with Enter from the password field should work exactly
    // like clicking the button -- a real keyboard-only user's actual path.
    await page.keyboard.press("Enter")
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10_000 })
  })
})
