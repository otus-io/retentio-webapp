import { test, expect } from '@playwright/test'
import {
  addColumn,
  addFactRow,
  closeFactTagsModal,
  createDeck,
  createTagInFactModal,
  ensureAndVerifyTagViaLibrary,
  deleteFirstFactViaRowMenu,
  deleteTagViaLibrary,
  editFirstFactCell,
  factModalCreateButton,
  factTagsModal,
  firstFactDataCell,
  getColumnHeaderText,
  gotoDeckFacts,
  gotoFirstDeckFacts,
  isTagSelectedInFactModal,
  openFirstFactTagsModal,
  renameColumn,
  skipUnlessE2ECredentials,
  toggleTagInFactModal,
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
    const deckName = uniqueName('FactRow')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)
  })

  test('should create a column', async ({ page }) => {
    const deckName = uniqueName('AddCol')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
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
    const deckName = uniqueName('RenameCol')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)

    const newName = uniqueName('Col')
    await renameColumn(page, 0, newName)

    await page.reload()
    await expect(page.locator('.ag-root')).toBeVisible()
    await expect.poll(async () => getColumnHeaderText(page, 0)).toContain(newName)
  })

  test('should delete a fact row via action menu', async ({ page }) => {
    const deckName = uniqueName('DeleteFact')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)
    await deleteFirstFactViaRowMenu(page)
  })

  test('should show attachment button after focusing a cell', async ({ page }) => {
    const deckName = uniqueName('Attach')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
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

test.describe('Fact tags', () => {
  test.beforeEach(() => {
    skipUnlessE2ECredentials()
  })

  test('should open tags modal from fact row menu', async ({ page }) => {
    const deckName = uniqueName('FactTagsOpen')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await expect(factTagsModal(page)).toBeVisible()
  })

  test('should associate existing tag with fact', async ({ page }) => {
    const deckName = uniqueName('FactTagAssoc')
    const tagName = uniqueName('FactTag')

    await createDeck(page, deckName)
    await ensureAndVerifyTagViaLibrary(page, { name: tagName })
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await toggleTagInFactModal(page, tagName)
    await closeFactTagsModal(page)

    await openFirstFactTagsModal(page)
    expect(await isTagSelectedInFactModal(page, tagName)).toBe(true)
  })

  test('should remove tag from fact', async ({ page }) => {
    const deckName = uniqueName('FactTagRemove')
    const tagName = uniqueName('RemoveFactTag')

    await createDeck(page, deckName)
    await ensureAndVerifyTagViaLibrary(page, { name: tagName })
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await toggleTagInFactModal(page, tagName)
    await closeFactTagsModal(page)

    await openFirstFactTagsModal(page)
    await toggleTagInFactModal(page, tagName)
    await closeFactTagsModal(page)

    await openFirstFactTagsModal(page)
    expect(await isTagSelectedInFactModal(page, tagName)).toBe(false)
  })

  test('should inline-create tag in fact modal', async ({ page }) => {
    const deckName = uniqueName('FactInlineTag')
    const existingTag = uniqueName('ExistingForPlus')
    const newTag = uniqueName('FactInlineNew')

    await createDeck(page, deckName)
    await ensureAndVerifyTagViaLibrary(page, { name: existingTag })
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await createTagInFactModal(page, newTag)
    await closeFactTagsModal(page)

    await openFirstFactTagsModal(page)
    expect(await isTagSelectedInFactModal(page, newTag)).toBe(true)
  })

  test('should allow creating first tag from empty fact modal', async ({ page }) => {
    const deckName = uniqueName('FactZeroTags')
    const tagName = uniqueName('FirstFactTag')

    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await expect(factModalCreateButton(page)).toBeVisible()
    await createTagInFactModal(page, tagName)
    await closeFactTagsModal(page)

    await openFirstFactTagsModal(page)
    expect(await isTagSelectedInFactModal(page, tagName)).toBe(true)
  })

  test('should remove tag from fact modal after tag deleted from library', async ({ page }) => {
    const deckName = uniqueName('FactTagCascade')
    const tagName = uniqueName('CascadeTag')

    await createDeck(page, deckName)
    await ensureAndVerifyTagViaLibrary(page, { name: tagName })
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await openFirstFactTagsModal(page)
    await toggleTagInFactModal(page, tagName)
    await closeFactTagsModal(page)

    await deleteTagViaLibrary(page, tagName)

    await gotoDeckFacts(page, deckName)
    await openFirstFactTagsModal(page)
    await expect(factTagsModal(page).getByText(tagName, { exact: true })).toHaveCount(0)
  })
})
