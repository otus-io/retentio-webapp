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
export async function createDeck(page: Page, name = 'TestDeck', tags?: string[]) {
  await page.goto('/decks/create')
  await page.locator('input[name="name"]').fill(name)

  const fieldInputs = page.locator('input[name="fields"]')
  await fieldInputs.nth(0).fill('field1')
  await fieldInputs.nth(1).fill('field2')

  if (tags?.length) {
    await selectTagsInDeckForm(page, tags)
  }

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

/**
 * 打开 /tags 页面
 */
export async function gotoTagsPage(page: Page) {
  await page.goto('/tags')
  await page.waitForLoadState('networkidle')
}

/**
 * Tags 列表页上的 tag chip（TagItem）
 */
export function tagChipOnLibrary(page: Page, tagName: string) {
  return page.locator('[data-slot="chip"]').filter({ hasText: tagName }).first()
}

/**
 * 打开 tag 创建/编辑 modal 的 + 按钮（Tags 列表页）
 */
export async function openTagLibraryCreateModal(page: Page) {
  await page.locator('[data-testid="create-button"]').click()
  await expect(tagFormModal(page)).toBeVisible()
}

function tagFormModal(page: Page) {
  return page.getByRole('dialog').filter({ has: page.locator('input[name="name"]') })
}

/**
 * 填写并提交 tag 表单 modal
 */
export async function fillAndSubmitTagForm(
  page: Page,
  options: { name: string, description?: string },
): Promise<'created' | 'at-limit'> {
  const modal = tagFormModal(page)
  await expect(modal).toBeVisible()
  await modal.locator('input[name="name"]').fill(options.name)
  if (options.description) {
    await modal.locator('textarea[name="description"]').fill(options.description)
  }

  // Tag library/picker forms submit via Next.js server actions, not browser /api/tags calls.
  await modal.getByRole('button', { name: 'Save' }).click()

  let outcome: 'created' | 'at-limit' = 'created'
  await expect.poll(async () => {
    if (await page.getByText('maximum number of tags reached').count() > 0) {
      outcome = 'at-limit'
      return true
    }
    if (!(await modal.isVisible())) {
      outcome = 'created'
      return true
    }
    return false
  }, { timeout: 15000 }).toBe(true)

  return outcome
}

/**
 * Ensure a tag exists for deck/fact tests. Creates when possible; reuses an existing tag when at user limit.
 */
export async function ensureTagViaLibrary(
  page: Page,
  options: { name: string, description?: string },
): Promise<string> {
  await gotoTagsPage(page)
  await openTagLibraryCreateModal(page)
  const outcome = await fillAndSubmitTagForm(page, options)
  if (outcome === 'created') {
    await expect(tagChipOnLibrary(page, options.name)).toBeVisible()
    return options.name
  }

  const modal = tagFormModal(page)
  await modal.getByRole('button', { name: 'Cancel' }).click()
  await expect(modal).toBeHidden()

  const firstChip = page.locator('[data-slot="chip"]').first()
  await expect(firstChip).toBeVisible()
  const tagName = await firstChip.evaluate((el) => el.getAttribute('data-tag-name')?.trim() ?? '')
  if (!tagName) {
    throw new Error('E2E setup failed: at tag limit and no existing tags on /tags')
  }
  return tagName
}

/**
 * Ensure a tag exists on /tags for deck/fact tests. Creates when possible;
 * reuses an existing tag when the user tag limit is reached. Always verifies
 * the returned tag chip is visible on the library page.
 */
export async function ensureAndVerifyTagViaLibrary(
  page: Page,
  options: { name: string, description?: string },
): Promise<string> {
  const tagName = await ensureTagViaLibrary(page, options)
  await expect(tagChipOnLibrary(page, tagName)).toBeVisible()
  return tagName
}

/**
 * 在 /tags 页面打开 tag 的 action 菜单
 */
export async function openTagLibraryMenu(page: Page, tagName: string) {
  const chip = tagChipOnLibrary(page, tagName)
  await chip.locator('[data-slot="dropdown-trigger"]').click()
}

/**
 * 在 /tags 页面编辑 tag
 */
export async function editTagViaLibrary(page: Page, tagName: string, newName: string) {
  await gotoTagsPage(page)
  await openTagLibraryMenu(page, tagName)
  await page.locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="edit"]').click()
  await fillAndSubmitTagForm(page, { name: newName })
  await expect(tagChipOnLibrary(page, newName)).toBeVisible()
}

/**
 * 在 /tags 页面删除 tag
 */
export async function deleteTagViaLibrary(page: Page, tagName: string) {
  await gotoTagsPage(page)
  await openTagLibraryMenu(page, tagName)
  await page.locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="delete"]').click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(tagChipOnLibrary(page, tagName)).toHaveCount(0, { timeout: 10000 })
}

/**
 * 从 decks 列表进入 deck 详情页
 */
export async function openDeckDetailFromList(page: Page, deckName: string) {
  await page.goto('/decks')
  await page.waitForLoadState('networkidle')
  const card = page.locator('[data-slot="card"]').filter({ hasText: deckName }).first()
  await expect(card).toBeVisible()
  await card.click()
  await page.waitForURL(/\/decks\/[^/]+$/)
}

/**
 * 打开 deck 表单中的 TagPicker
 */
export async function openDeckTagPicker(page: Page) {
  const picker = page.getByRole('group').filter({ hasText: 'Select tags' })
  await picker.scrollIntoViewIfNeeded()
  await picker.click()
  await expect(page.getByPlaceholder('Search tags...')).toBeVisible()
}

/**
 * 在 deck 表单 TagPicker 中选择已有 tag
 */
export async function selectTagsInDeckForm(page: Page, tagNames: string[]) {
  for (const tagName of tagNames) {
    await openDeckTagPicker(page)
    await page.getByRole('option', { name: tagName }).click()
    await page.keyboard.press('Escape')
    await expect(page.locator('[aria-label="selected tag"]').getByText(tagName)).toBeVisible()
  }
}

/**
 * 在 deck 表单 TagPicker 内联创建 tag
 */
export async function createTagInDeckPicker(page: Page, tagName: string) {
  await openDeckTagPicker(page)
  await page.locator('#tag-picker-add-button').click()
  await fillAndSubmitTagForm(page, { name: tagName })
  await expect(page.locator('[aria-label="selected tag"]').getByText(tagName)).toBeVisible()
}

/**
 * 从 deck 表单 TagPicker 移除已选 tag chip
 */
export async function removeTagChipInDeckForm(page: Page, tagName: string) {
  const chip = page.locator('[aria-label="selected tag"]').locator('[data-slot="tag"]').filter({ hasText: tagName })
  await chip.getByRole('button').click()
  await expect(page.locator('[aria-label="selected tag"]').getByText(tagName, { exact: true })).toHaveCount(0)
}

/**
 * deck 详情页上的 tag chip（只读 TagItem）
 */
export function tagChipOnDeckDetail(page: Page, tagName: string) {
  return page.locator('[data-slot="chip"]').filter({ hasText: tagName }).first()
}

/**
 * 打开第一行 fact 的 tags modal
 */
export async function openFirstFactTagsModal(page: Page) {
  const actionCell = page.locator('.ag-pinned-right-cols-container [role="row"]').first()
  await actionCell.locator('[data-slot="dropdown-trigger"]').click()
  await page
    .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="tag"]')
    .click()
  const modal = factTagsModal(page)
  await expect(modal).toBeVisible()
  await expect(modal.locator('[data-slot="spinner"]')).toHaveCount(0, { timeout: 10000 })
}

export function factTagsModal(page: Page) {
  return page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Tags' }) })
}

/**
 * 关闭 fact tags modal
 */
export async function closeFactTagsModal(page: Page) {
  await factTagsModal(page).locator('[data-slot="button"].button--secondary').filter({ hasText: 'Close' }).click()
  await expect(factTagsModal(page)).toBeHidden()
}

/**
 * fact tags modal 中的 tag 元素
 */
export function factModalTag(page: Page, tagName: string) {
  return factTagsModal(page).getByRole('gridcell', { name: tagName })
}

/**
 * 在 fact tags modal 中切换 tag 选中状态
 */
export async function toggleTagInFactModal(page: Page, tagName: string) {
  const modal = factTagsModal(page)
  const tag = modal.locator('[data-slot="tag"]').filter({ hasText: tagName }).first()
  const wasSelected = await isTagSelectedInFactModal(page, tagName)

  const responsePromise = page.waitForResponse(
    (r) => {
      const method = wasSelected ? 'DELETE' : 'PUT'
      return r.request().method() === method
        && /\/api\/decks\/[^/]+\/facts\/[^/]+\/tags\/[^/]+$/.test(r.url())
        && r.ok()
    },
  )
  await tag.scrollIntoViewIfNeeded()
  await tag.click()
  await responsePromise
}

/**
 * fact tags modal 内的 + 创建按钮
 */
export function factModalCreateButton(page: Page) {
  return factTagsModal(page).locator('button[data-slot="button"].button--icon-only.button--primary')
}

/**
 * 在 fact tags modal 内联创建 tag
 */
export async function createTagInFactModal(page: Page, tagName: string) {
  await factModalCreateButton(page).click()
  const associatePromise = page.waitForResponse(
    (r) => r.request().method() === 'PUT' && /\/api\/decks\/[^/]+\/facts\/[^/]+\/tags\/[^/]+$/.test(r.url()) && r.ok(),
  )
  await fillAndSubmitTagForm(page, { name: tagName })
  await associatePromise
}

/**
 * 检查 fact tags modal 中 tag 是否选中
 */
export async function isTagSelectedInFactModal(page: Page, tagName: string): Promise<boolean> {
  const modal = factTagsModal(page)
  const tag = modal.locator('[data-slot="tag"]').filter({ hasText: tagName }).first()
  if (await tag.getAttribute('data-selected') === 'true') return true
  if (await tag.getAttribute('aria-pressed') === 'true') return true
  const selectedClass = await tag.getAttribute('class')
  return selectedClass?.includes('selected') ?? false
}
