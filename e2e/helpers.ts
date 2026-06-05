import { expect, type Page } from '@playwright/test'

/**
 * 创建一个 deck，成功后会 redirect 回 /decks
 */
export async function createDeck(page: Page, name = 'TestDeck') {
  await page.goto('/decks/create')
  await page.locator('input[name="name"]').fill(name)

  const fieldInputs = page.locator('input[name="fields"]')
  await fieldInputs.nth(0).fill('field1')
  await fieldInputs.nth(1).fill('field2')

  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/decks', { timeout: 10000 })
}

/**
 * 进入第一个 deck 的 facts 页面（没有 deck 时先创建一个），
 * 返回时 ag-grid 已渲染
 */
export async function gotoFirstDeckFacts(page: Page) {
  await page.goto('/decks')
  await page.waitForLoadState('networkidle')

  const cards = page.locator('[data-slot="card"]')
  const count = await cards.count()
  if (count === 0) {
    await createDeck(page)
    await page.waitForLoadState('networkidle')
  }

  // 点击第一个 deck 卡片，进入详情页
  await cards.first().click()
  await page.waitForURL(/\/decks\/[^/]+$/)

  // 打开详情页 card 内的下拉菜单，点击 facts 菜单项
  await page.locator('[data-slot="card"] [data-slot="dropdown-trigger"]').click()
  await page
    .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="facts"]')
    .click()

  // 进入 facts 页面，等待 ag-grid 渲染
  await page.waitForURL(/\/decks\/[^/]+\/facts$/)
  await expect(page.locator('.ag-root')).toBeVisible()
}

/**
 * 在当前 facts 页面新建一行（prepend），等待新行第一格渲染完成
 */
export async function addFactRow(page: Page) {
  const icon = page.locator('.facts-grid-create-row-icon')
  await expect(icon).toBeVisible()

  // 点击新建行：触发 loading（icon 被 spinner 替换而消失），结束后 icon 重新出现
  await page.locator('#facts-grid-create-row').click()
  await expect(icon).toBeHidden()
  await expect(icon).toBeVisible()

  // 新行渲染需要时间，轮询等待：第一个 cell 文本 === 第一列字段名
  // 注意：列头处于编辑态时渲染为 <input>，字段名在 value 上（textContent 为空）
  await expect(async () => {
    const equal = await page.evaluate(() => {
      const header = document.querySelectorAll('.facts-grid-header-renderer')[0]
      const cell = document.querySelectorAll('.facts-grid-cell-renderer')[0]
      if (!header || !cell) return false
      const headerName = header.querySelector('input')?.value ?? header.textContent
      return headerName === cell.textContent
    })
    expect(equal).toBe(true)
  }).toPass({ timeout: 10000 })
}

/**
 * 在当前 facts 页面新增一列，确认输入后等待 3 秒
 */
export async function addColumn(page: Page) {
  // 点击创建列按钮
  await page.locator('#facts-grid-create-col-button').click()

  // 获取新增列的输入框
  const lastInput = page.locator('.facts-grid-header-renderer').last().locator('input')
  await expect(lastInput).toBeVisible()

  // 确认输入
  await lastInput.press('Escape')

  // 等待 3 秒以确保列被正确初始化
  await page.waitForTimeout(3000)
}
