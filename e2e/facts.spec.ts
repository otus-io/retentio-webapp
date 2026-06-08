import { test, expect } from '@playwright/test'
import {
  addColumn,
  addFactRow,
  createDeck,
  deleteFirstFactViaRowMenu,
  editFirstFactCell,
  firstFactDataCell,
  getColumnHeaderText,
  gotoDeckFacts,
  gotoFirstDeckFacts,
  renameColumn,
  skipUnlessE2ECredentials,
  uniqueName,
} from './helpers'

test.describe('Facts', () => {
  test.beforeEach(() => {
    skipUnlessE2ECredentials()
  })

  test('should navigate to a deck facts page', async ({ page }) => {
    await gotoFirstDeckFacts(page)
    await expect(page).toHaveURL(/\/decks\/[^/]+\/facts$/)
  })

  test('should create a fact row', async ({ page }) => {
    await gotoFirstDeckFacts(page)
    await addFactRow(page)
  })

  test('should create a column', async ({ page }) => {
    await gotoFirstDeckFacts(page)
    const headers = page.locator('.facts-grid-header-renderer')
    const before = await headers.count()
    await addColumn(page)
    await expect(headers).toHaveCount(before + 1)
  })

  test('should update fact cell text', async ({ page }) => {
    const deckName = uniqueName('EditFact')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    const cellText = uniqueName('Fact')
    await editFirstFactCell(page, cellText)

    await page.reload()
    await expect(page.locator('.ag-root')).toBeVisible()
    await expect(firstFactDataCell(page)).toContainText(cellText)
  })

  test('should rename a column header', async ({ page }) => {
    await gotoFirstDeckFacts(page)

    const newName = uniqueName('Col')
    await renameColumn(page, 0, newName)

    await page.reload()
    await expect(page.locator('.ag-root')).toBeVisible()
    await expect.poll(async () => getColumnHeaderText(page, 0)).toContain(newName)
  })

  test('should delete a fact row via action menu', async ({ page }) => {
    await gotoFirstDeckFacts(page)
    await addFactRow(page)
    await deleteFirstFactViaRowMenu(page)
  })

  test('should show attachment button after focusing a cell', async ({ page }) => {
    await gotoFirstDeckFacts(page)
    await addFactRow(page)
    await addColumn(page)

    // 第一行（center 容器，不含 pinned-right 的 action 列）的最后一个单元格
    const firstRow = page.locator('.ag-center-cols-container [role="row"]').first()
    await expect(firstRow).toBeVisible()
    const lastCell = firstRow.locator('.ag-cell').last()

    // 附件按钮默认 display:none（--cell-display: none），聚焦前不可见
    const mediaButton = lastCell.locator('.facts-grid-cell-media')
    await expect(mediaButton).toBeHidden()

    // 点击单元格 → ag-grid 赋予 .ag-cell-focus 且 DOM :focus-within，
    // globals.css 将 --cell-display 置为 block，附件按钮变为可见
    await lastCell.click()
    await expect(mediaButton).toBeVisible()

    // 点击附件按钮
    await mediaButton.click()
  })
})
