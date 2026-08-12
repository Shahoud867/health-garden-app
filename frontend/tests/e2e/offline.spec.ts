import { test, expect } from "@playwright/test"
import { signUpNewUser, completeOnboarding, uniqueTestEmail } from "./helpers"

/**
 * The offline write queue's real value only shows up under an actual
 * dropped connection -- `page.context().setOffline(true)` is a real
 * network-level block (Playwright/CDP), not a mocked navigator.onLine,
 * so this exercises the exact same browser API path (lib/offlineQueue.ts's
 * IndexedDB persistence + the `navigator.onLine` check each logging
 * screen makes) a real user's dropped wifi would.
 */
test("logging weight while offline queues it, shows the sync-pending state, and syncs once back online", async ({
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

  await page.context().setOffline(true)

  await weightInput.fill("")
  await weightInput.fill("68.5")
  const saveButton = page.getByRole("button", { name: "Save" })
  await expect(saveButton).toBeEnabled()
  await saveButton.click()

  // The offline path doesn't wait for a network round trip at all -- it
  // should be near-instant, not racing a 20s timeout the way the online
  // save path does. Both the toast (WeightScreen's showToast) and the
  // ambient SyncBadge render the exact same t('syncPending', lang) string
  // at once here -- .first() rather than asserting on the ambiguous text
  // twice, since either one appearing is equally real proof the offline
  // path fired.
  await expect(page.getByText("Saved locally").first()).toBeVisible({
    timeout: 5_000,
  })

  await page.context().setOffline(false)

  // Back online: useOfflineSync's `online` listener should drain the queue
  // without any user action, and the sync badge should settle back to
  // "All synced" (SyncBadge's real synced-state label) once it does.
  await expect(page.getByText("All synced")).toBeVisible({
    timeout: 15_000,
  })

  // Reload to prove the write actually reached the database, not just
  // local state -- same "did this survive a reload" bar the water-logging
  // test already holds itself to.
  await page.reload()
  await page.getByRole("button", { name: /track weight/i }).click()
  await expect(page.getByTestId("weight-current")).toHaveText("68.5kg", {
    timeout: 10_000,
  })
})
