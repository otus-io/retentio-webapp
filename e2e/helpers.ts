import { expect, test, type Page } from '@playwright/test'

export function skipUnlessE2ECredentials() {
  test.skip(
    !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
    'Requires E2E_USERNAME and E2E_PASSWORD',
  )
}

export function uniqueName(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

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
 * 从 decks 列表打开指定 deck（或第一个）的编辑页
 */
export async function openDeckEditFromList(page: Page, deckName?: string) {
  await page.goto('/decks')

  const card = deckName
    ? page.locator('[data-slot="card"]').filter({ hasText: deckName }).first()
    : page.locator('[data-slot="card"]').first()
  await expect(card).toBeVisible()
  await card.locator('[data-slot="dropdown-trigger"]').click()
  await page
    .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="edit"]')
    .click()
  await page.waitForURL(/\/decks\/[^/]+\/edit$/)
}

/**
 * 提交 deck 表单并等待回到 /decks
 */
export async function submitDeckForm(page: Page) {
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/decks', { timeout: 10000 })
}

/**
 * 进入指定 deck 的 facts 页面
 */
export async function gotoDeckFacts(page: Page, deckName: string) {
  await page.goto('/decks')

  const card = page.locator('[data-slot="card"]').filter({ hasText: deckName }).first()
  await expect(card).toBeVisible()
  await card.click()
  await page.waitForURL(/\/decks\/[^/]+$/)

  await page.locator('[data-slot="card"] [data-slot="dropdown-trigger"]').click()
  await page
    .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="facts"]')
    .click()

  await page.waitForURL(/\/decks\/[^/]+\/facts$/)
  await expect(page.locator('.ag-root')).toBeVisible()
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
  const rowsBefore = await page.locator('.ag-center-cols-container [role="row"]').count()
  const icon = page.locator('.facts-grid-create-row-icon')
  await expect(icon).toBeVisible()

  await page.locator('#facts-grid-create-row').click()
  await page.waitForURL(/\/decks\/[^/]+\/facts$/)
  await expect(page.locator('.ag-root')).toBeVisible()

  await expect(async () => {
    const rowsAfter = await page.locator('.ag-center-cols-container [role="row"]').count()
    expect(rowsAfter).toBeGreaterThan(rowsBefore)
  }).toPass({ timeout: 10000 })

  await expect(page.locator('.facts-grid-create-row-icon')).toBeVisible()
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

/**
 * 读取 facts 列头文本（header 可能处于 input 编辑态）
 */
export async function getColumnHeaderText(page: Page, columnIndex: number): Promise<string> {
  const header = page.locator('.facts-grid-header-renderer').nth(columnIndex)
  return header.evaluate((el) => {
    const inp = el.querySelector('input')
    return inp?.value ?? el.textContent ?? ''
  })
}

/**
 * 第一行第一个 fact 数据单元格（跳过 row-selection checkbox 列）
 */
export function firstFactDataCell(page: Page) {
  return page
    .locator('.ag-center-cols-container [role="row"]')
    .first()
    .locator('.ag-cell')
    .nth(1)
}

/**
 * 编辑第一行第一列 fact 单元格文本
 */
export async function editFirstFactCell(page: Page, text: string) {
  const cell = firstFactDataCell(page)

  const savePromise = page.waitForResponse(
    (r) => r.request().method() === 'PATCH' && /\/api\/decks\/[^/]+\/facts\//.test(r.url()) && r.ok(),
  )

  await cell.dblclick()

  const editorInput = cell.getByRole('textbox')
  await expect(editorInput).toBeVisible({ timeout: 5000 })
  await editorInput.fill(text)
  await editorInput.press('Tab')
  await savePromise

  await expect(cell.locator('.facts-grid-cell-renderer span')).toContainText(text, { timeout: 5000 })
}

/**
 * 重命名 facts 表格指定列头
 */
export async function renameColumn(page: Page, columnIndex: number, newName: string) {
  const header = page.locator('.facts-grid-header-renderer').nth(columnIndex)
  const input = header.locator('input')
  await expect(input).toBeVisible()

  const savePromise = page.waitForResponse(
    (r) => r.request().method() === 'PATCH' && /\/api\/decks\/[^/]+$/.test(r.url()) && r.ok(),
  )
  await input.fill(newName)
  await input.press('Escape')
  await savePromise

  await expect.poll(async () => getColumnHeaderText(page, columnIndex)).toContain(newName)
}

/**
 * 通过行内 action 菜单删除第一行 fact
 */
export async function deleteFirstFactViaRowMenu(page: Page) {
  const rowsBefore = await page.locator('.ag-center-cols-container [role="row"]').count()
  const actionCell = page.locator('.ag-pinned-right-cols-container [role="row"]').first()
  await actionCell.locator('[data-slot="dropdown-trigger"]').click()
  await page
    .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="delete"]')
    .click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(/\/decks\/[^/]+\/facts$/)
  await expect(async () => {
    const rowsAfter = await page.locator('.ag-center-cols-container [role="row"]').count()
    expect(rowsAfter).toBeLessThan(rowsBefore)
  }).toPass({ timeout: 10000 })
}
