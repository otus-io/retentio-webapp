import { test, expect } from '@playwright/test'

test('should load the homepage', async ({ page }) => {
  console.log('📄 page 对象:', typeof page)
  console.log('🔗 page URL:', page.url())

  await page.goto('/')

  console.log('✅ 页面已加载')
  console.log('📍 当前 URL:', page.url())
  console.log('📰 页面标题:', await page.title())

  await expect(page).toHaveTitle(/Rete/)
})

// test('should navigate between pages', async ({ page }) => {
//   await page.goto('/')
//   const headings = page.locator('h1').first()
//   await expect(headings).toBeVisible()
// })
