import { test, expect } from '@playwright/test'

test('should be logged in via global setup', async ({ page }) => {
  await page.goto('/')
  await expect(page).not.toHaveURL(/\/login/)
})

test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="username"]').fill('invalid-user')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
  })
})
