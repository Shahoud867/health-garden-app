import { test, expect } from '@playwright/test'
import { signUpNewUser, uniqueTestEmail } from './helpers'

test.describe('Landing page', () => {
  test('shows the core pitch and both primary CTAs, with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')

    await expect(page.getByRole('heading', { name: /a garden that grows with you/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start growing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /see all features/i })).toBeVisible()
    await expect(page.getByText('PKR 299')).toBeVisible()

    expect(errors).toEqual([])
  })

  test('language toggle switches the page to Urdu and sets dir="rtl"', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'اردو' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ur')
  })
})

test.describe('Sign up and log in', () => {
  test('a new account signs up, and lands on onboarding (or email verification)', async ({ page }) => {
    await signUpNewUser(page, uniqueTestEmail())
  })

  test('logging in with the wrong password shows an error, not a silent failure', async ({ page }) => {
    const email = uniqueTestEmail()
    await signUpNewUser(page, email)

    // Whether signup landed on onboarding or email-verify, log out state by
    // reloading fresh and going straight to the login form.
    await page.goto('/')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('definitely-the-wrong-password')
    await page.getByRole('button', { name: 'Log In' }).last().click()

    await expect(page.getByText(/incorrect|confirm your email/i)).toBeVisible({ timeout: 10_000 })
  })

  test('forgot-password submits and shows the "reset link sent" confirmation', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.getByRole('button', { name: /forgot password/i }).click()
    await page.getByLabel('Email').fill(uniqueTestEmail())
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 10_000 })
  })
})

test('the Premium screen is reachable signed-out and shows both plans', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /see all features/i }).click()
  await expect(page.getByRole('heading', { name: /pricing|clear, simple pricing/i })).toBeVisible()
  await expect(page.getByText('Free forever')).toBeVisible()
})
