import { chromium, type FullConfig } from '@playwright/test'

export default async function globalSetup(config: FullConfig) {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  if (!username || !password) {
    console.warn('E2E_USERNAME or E2E_PASSWORD not set, skipping global auth setup')
    return
  }

  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_TEST_BASE_URL ??
    'http://localhost:3000'

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  await page.goto('/login')
  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/', { timeout: 10000 })

  await context.storageState({ path: 'e2e/.auth-state.json' })
  await page.close()
  await browser.close()
}
