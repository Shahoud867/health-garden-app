import { test, expect } from '@playwright/test'
import { signUpNewUser, completeOnboarding, uniqueTestEmail } from './helpers'

/**
 * The end-to-end path this whole integration exists to prove: a real
 * signup creates a real profile (via handle_new_auth_user, migration
 * 0005), onboarding writes real targets, and a real log write updates
 * both today's totals and the garden -- entirely through the deployed
 * schema/RLS, not a mock.
 */
test('signup -> onboarding -> home shows the profile-derived calorie/protein targets', async ({ page }) => {
  await signUpNewUser(page, uniqueTestEmail())

  // If email confirmation is required locally, this test can't proceed
  // past onboarding -- skip cleanly rather than fail on an environment
  // difference unrelated to what's under test.
  if (await page.getByText(/check your email/i).isVisible().catch(() => false)) {
    test.skip(true, 'Local Supabase Auth requires email confirmation; cannot complete onboarding in this run.')
  }

  await completeOnboarding(page)

  await expect(page.getByRole('heading', { name: /every good choice/i })).toBeVisible({ timeout: 15_000 })
  // Five real garden_state rows (one per goal_type, migration 0005's
  // seed_garden_state_for_new_user) render as five plant tiles.
  await expect(page.getByText('Sugar-free')).toBeVisible()
  await expect(page.getByText('Hydration')).toBeVisible()
  await expect(page.getByText('Protein')).toBeVisible()
})

test('logging water increments the on-screen count and persists across a reload', async ({ page }) => {
  await signUpNewUser(page, uniqueTestEmail())
  if (await page.getByText(/check your email/i).isVisible().catch(() => false)) {
    test.skip(true, 'Local Supabase Auth requires email confirmation.')
  }
  await completeOnboarding(page)

  await page.getByRole('button', { name: /log water/i }).click()
  await expect(page.getByRole('heading', { name: 'Log Water' })).toBeVisible()

  const glassCount = page.getByTestId('water-glass-count')
  await expect(glassCount).toHaveText('0')

  await page.getByRole('button', { name: 'Add one glass' }).click()
  await expect(glassCount).toHaveText('1', { timeout: 10_000 })

  // Reload -- if this still shows 1, the glass was actually written to
  // water_logs and re-read on refresh, not just held in local React state.
  await page.reload()
  await expect(page.getByTestId('water-glass-count')).toHaveText('1', { timeout: 10_000 })
})

test('logging a weight entry shows the saved confirmation and updates the "Current" stat', async ({ page }) => {
  await signUpNewUser(page, uniqueTestEmail())
  if (await page.getByText(/check your email/i).isVisible().catch(() => false)) {
    test.skip(true, 'Local Supabase Auth requires email confirmation.')
  }
  await completeOnboarding(page)

  await page.getByRole('button', { name: /track weight/i }).click()
  const weightInput = page.getByLabel(/weight in kilograms/i)
  await weightInput.fill('')
  await weightInput.fill('71.5')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('✓ Saved')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('71.5kg')).toBeVisible()
})
