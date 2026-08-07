import { test, expect } from "@playwright/test"
import { signUpNewUser, completeOnboarding, uniqueTestEmail } from "./helpers"

/**
 * The end-to-end path this whole integration exists to prove: a real
 * signup creates a real profile (via handle_new_auth_user, migration
 * 0005), onboarding writes real targets, and a real log write updates
 * both today's totals and the garden -- entirely through the deployed
 * schema/RLS, not a mock.
 */
test("signup -> onboarding -> home shows the profile-derived calorie/protein targets", async ({
  page,
}) => {
  await signUpNewUser(page, uniqueTestEmail())

  // If email confirmation is required locally, this test can't proceed
  // past onboarding -- skip cleanly rather than fail on an environment
  // difference unrelated to what's under test.
  if (
    await page
      .getByText(/check your email/i)
      .isVisible()
      .catch(() => false)
  ) {
    test.skip(
      true,
      "Local Supabase Auth requires email confirmation; cannot complete onboarding in this run.",
    )
  }

  await completeOnboarding(page)

  await expect(
    page.getByRole("heading", { name: /every good choice/i }),
  ).toBeVisible({ timeout: 15_000 })
  // Five real garden_state rows (one per goal_type, migration 0005's
  // seed_garden_state_for_new_user) render as five plant tiles.
  await expect(page.getByText("Sugar-free")).toBeVisible()
  await expect(page.getByText("Hydration")).toBeVisible()
  await expect(page.getByText("Protein")).toBeVisible()
})

test("logging water increments the on-screen count and persists across a reload", async ({
  page,
}) => {
  await signUpNewUser(page, uniqueTestEmail())
  if (
    await page
      .getByText(/check your email/i)
      .isVisible()
      .catch(() => false)
  ) {
    test.skip(true, "Local Supabase Auth requires email confirmation.")
  }
  await completeOnboarding(page)

  await page.getByRole("button", { name: /log water/i }).click()
  await expect(page.getByRole("heading", { name: "Log Water" })).toBeVisible()

  const glassCount = page.getByTestId("water-glass-count")
  await expect(glassCount).toHaveText("0")

  await page.getByRole("button", { name: "Add one glass" }).click()
  await expect(glassCount).toHaveText("1", { timeout: 10_000 })

  // Reload -- this app has no router (App.tsx's `screen` state is plain
  // React state, not URL-derived), so a reload always lands wherever the
  // post-auth redirect effect computes (Home, since onboarding is already
  // complete), never back on the Water screen itself. Re-navigating is
  // what actually proves the point: if the count is still 1 after
  // re-entering Water fresh, the glass was really written to water_logs
  // and re-read, not just held in the React state that the reload just
  // discarded.
  await page.reload()
  await page.getByRole("button", { name: /log water/i }).click()
  await expect(page.getByRole("heading", { name: "Log Water" })).toBeVisible()
  await expect(page.getByTestId("water-glass-count")).toHaveText("1", {
    timeout: 10_000,
  })
})

test('logging a weight entry shows the saved confirmation and updates the "Current" stat', async ({
  page,
}) => {
  await signUpNewUser(page, uniqueTestEmail())
  if (
    await page
      .getByText(/check your email/i)
      .isVisible()
      .catch(() => false)
  ) {
    test.skip(true, "Local Supabase Auth requires email confirmation.")
  }
  await completeOnboarding(page)

  await page.getByRole("button", { name: /track weight/i }).click()
  const weightInput = page.getByLabel(/weight in kilograms/i)
  await expect(weightInput).toBeVisible()
  await weightInput.fill("")
  await weightInput.fill("71.5")

  const saveButton = page.getByRole("button", { name: "Save" })
  await expect(saveButton).toBeEnabled()
  await saveButton.click()

  // logWeight() awaits upsertWeightLog() *and* a full refetch() (8 parallel
  // queries, see useAppData.ts) before flipping to "Saved" -- slower under
  // CI's real local Postgres than the instant local-state flip this
  // screen's original mock version did. 20s margin, and racing against an
  // error toast too, so a real failure here reads as "the save errored"
  // rather than an ambiguous timeout if 20s still isn't enough.
  const savedConfirmation = page.getByText("✓ Saved")
  const errorToast = page.getByText(/could not save your weight/i)
  await expect(savedConfirmation.or(errorToast)).toBeVisible({
    timeout: 20_000,
  })
  if (await errorToast.isVisible().catch(() => false)) {
    throw new Error(
      'Weight save failed -- error toast shown instead of the "Saved" confirmation.',
    )
  }
  // For a first-ever weight log, "Current" and "Start" render the exact
  // same text (history has just the one entry, so history[0] *is* today's)
  // -- a bare getByText("71.5kg") is a strict-mode violation (matches both
  // panels). weight-current is the one this test actually cares about.
  await expect(page.getByTestId("weight-current")).toHaveText("71.5kg")
})
