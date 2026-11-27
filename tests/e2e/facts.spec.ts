import { test, expect } from '@playwright/test'
import {
  addFactRow,
  closeFactTagsModal,
  createDeck,
  createTagInFactModal,
  ensureAndVerifyTagViaLibrary,
  chooseFirstFactCellMenuItem,
  deleteFirstFactViaCellMenu,
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

  test('should update fact cell text', async ({ page }) => {
    const deckName = uniqueName('EditFact')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    const cellText = uniqueName('Fact')
    await editFirstFactCell(page, cellText)

    await page.reload()
    await expect(page.locator('.jss_worksheet')).toBeVisible()
    await expect(firstFactDataCell(page)).toContainText(cellText)
  })

  test('should rename a column header', async ({ page }) => {
    const deckName = uniqueName('RenameCol')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)

    const newName = uniqueName('Col')
    await renameColumn(page, 0, newName)

    await page.reload()
    await expect(page.locator('.jss_worksheet')).toBeVisible()
    await expect.poll(async () => getColumnHeaderText(page, 0)).toContain(newName)
  })

  test('should delete a fact row via cell menu', async ({ page }) => {
    const deckName = uniqueName('DeleteFact')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)
    await deleteFirstFactViaCellMenu(page)
  })

  test('should open attachments from the cell right-click menu', async ({ page }) => {
    const deckName = uniqueName('Attach')
    await createDeck(page, deckName)
    await gotoDeckFacts(page, deckName)
    await addFactRow(page)

    await chooseFirstFactCellMenuItem(page, 'attachment')
    await expect(page.getByRole('dialog', { name: 'Attachment' })).toBeVisible()
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

  test('should create tag in fact modal', async ({ page }) => {
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
