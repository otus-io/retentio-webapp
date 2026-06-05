import { loadEnvConfig } from '@next/env'
import { defineConfig, devices } from '@playwright/test'

loadEnvConfig(process.cwd())

const isCI = !!process.env.CI
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

const allBrowserProjects = [
  { name: 'chromium', use: { ...devices['desktop-chromium'] } },
  { name: 'firefox', use: { ...devices['desktop-firefox'] } },
  { name: 'webkit', use: { ...devices['desktop-webkit'] } },
] as const

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    storageState: 'e2e/.auth-state.json',
  },

  projects: isCI ? [allBrowserProjects[0]] : [...allBrowserProjects],

  webServer: {
    command: isCI ? 'pnpm run start' : 'pnpm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
