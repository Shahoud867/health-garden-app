import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Matches the backend DB test suite's own unique-email convention
 * (supabase/tests/database/helpers.ts's createTestUser) so a human
 * scanning `auth.users` in the Supabase dashboard can tell which rows
 * came from which suite. */
let counter = 0
export function uniqueTestEmail(): string {
  counter += 1
  return `e2e-${Date.now()}-${counter}@example.test`
}

export const TEST_PASSWORD = 'Test-password-1234!'

/**
 * Signs up a brand-new user through the real UI and waits for the redirect
 * to onboarding. Assumes local Supabase Auth has email confirmations
 * disabled (`supabase/config.toml`'s local dev default) -- the same
 * assumption the backend's own DB test suite already makes.
 */
export async function signUpNewUser(page: Page, email: string): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: /start growing/i }).click()
  await page.getByLabel('Full Name').fill('Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign Up' }).click()
  // Either lands on onboarding immediately (confirmations off) or on the
  // "check your email" screen (confirmations on) -- fail loudly either way
  // if neither shows up, rather than silently timing out ambiguously.
  await expect(
    page.getByText(/build your baseline|check your email/i).first(),
  ).toBeVisible({ timeout: 15_000 })
}

/** Completes every onboarding step with fixed, valid values. */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.getByRole('button', { name: /I understand/i }).click()

  // Step: profile -- OnboardingScreen labels this field with t('name', lang),
  // same as AuthScreen's signup form ("Full Name"), not "Name".
  await page.getByLabel('Full Name').fill('Test User')
  await page.getByLabel('Age').fill('28')
  await page.getByLabel('Height (cm)').fill('170')
  await page.getByLabel('Weight (kg)').fill('68')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step: activity
  await page.getByText('Moderately active', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step: goal
  await page.getByText('General health', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step: conditions -- "None of these" is selected by default, just continue.
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step: targets (final)
  await page.getByRole('button', { name: /start my garden/i }).click()
}
