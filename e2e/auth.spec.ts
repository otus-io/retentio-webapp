import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // 访问登录页面
    await page.goto('/login')

    // 验证页面已加载
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h3')).toBeVisible()

    // 填写用户名
    const username = process.env.E2E_USERNAME
    const password = process.env.E2E_PASSWORD
    if (!username || !password) {
      test.skip()
      return
    }

    const usernameInput = page.locator('input[name="username"]')
    await usernameInput.fill(username)

    // 填写密码
    const passwordInput = page.locator('input[name="password"]')
    await passwordInput.fill(password)

    // 点击登录按钮
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // 等待登录完成并重定向
    await page.waitForURL('/', { timeout: 10000 })

    // 验证已登录（不在登录页面）
    await expect(page).not.toHaveURL(/\/login/)
    console.log('✅ 登录成功！当前页面:', page.url())
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // 填写错误的凭证
    await page.locator('input[name="username"]').fill('invalid-user')
    await page.locator('input[name="password"]').fill('wrongpassword')

    // 点击登录
    await page.locator('button[type="submit"]').click()

    // 等待错误消息出现
    const errorMessage = page.locator('[role="alert"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    console.log('✅ 错误处理正确！')
  })
})
