import { test, expect } from '@playwright/test'
import {
  createDeck,
  createTagInDeckPicker,
  ensureAndVerifyTagViaLibrary,
  openDeckDetailFromList,
  openDeckEditFromList,
  removeTagChipInDeckForm,
  selectTagsInDeckForm,
  skipUnlessE2ECredentials,
  submitDeckForm,
  tagChipOnDeckDetail,
  uniqueName,
} from './helpers'

test.describe('Decks', () => {
  test.beforeEach(() => {
    skipUnlessE2ECredentials()
  })

  test('should create a deck', async ({ page }) => {
    await createDeck(page)
    await expect(page).toHaveURL(/\/decks$/)
  })

  test('should update deck name and fields', async ({ page }) => {
    const originalName = uniqueName('Deck')
    const updatedName = uniqueName('Updated')

    await createDeck(page, originalName)
    await openDeckEditFromList(page, originalName)

    await page.locator('input[name="name"]').fill(updatedName)
    const fieldInputs = page.locator('input[name="fields"]')
    await fieldInputs.nth(0).fill('front')
    await fieldInputs.nth(1).fill('back')
    await submitDeckForm(page)

    await expect(page.locator('[data-slot="card"]').filter({ hasText: updatedName })).toBeVisible()
    await expect(page.locator('[data-slot="card"]').filter({ hasText: originalName })).toHaveCount(0)
  })

  test('should attach tags on deck edit', async ({ page }) => {
    const deckName = uniqueName('DeckTag')
    const preferredTagName = uniqueName('DeckTagLabel')

    await createDeck(page, deckName)
    const tagName = await ensureAndVerifyTagViaLibrary(page, { name: preferredTagName })
    await openDeckEditFromList(page, deckName)

    await selectTagsInDeckForm(page, [tagName])
    await submitDeckForm(page)

    await openDeckDetailFromList(page, deckName)
    await expect(tagChipOnDeckDetail(page, tagName)).toBeVisible()
  })

  test('should detach tag on deck edit', async ({ page }) => {
    const deckName = uniqueName('DeckUntag')
    const preferredTagName = uniqueName('DetachTag')

    await createDeck(page, deckName)
    const tagName = await ensureAndVerifyTagViaLibrary(page, { name: preferredTagName })
    await openDeckEditFromList(page, deckName)
    await selectTagsInDeckForm(page, [tagName])
    await submitDeckForm(page)

    await openDeckEditFromList(page, deckName)
    await removeTagChipInDeckForm(page, tagName)
    await submitDeckForm(page)

    await openDeckDetailFromList(page, deckName)
    await expect(tagChipOnDeckDetail(page, tagName)).toHaveCount(0)
  })

  test('should inline-create tag in TagPicker on deck edit', async ({ page }) => {
    const deckName = uniqueName('DeckInlineTag')
    const tagName = uniqueName('InlineTag')

    await createDeck(page, deckName)
    await openDeckEditFromList(page, deckName)
    await createTagInDeckPicker(page, tagName)
    await submitDeckForm(page)

    await openDeckEditFromList(page, deckName)
    await expect(page.locator('[aria-label="selected tag"]').getByText(tagName)).toBeVisible()
  })

  test('should persist deck tags on deck create', async ({ page }) => {
    const deckName = uniqueName('DeckCreateTag')
    const preferredTagName = uniqueName('CreateFlowTag')

    const tagName = await ensureAndVerifyTagViaLibrary(page, { name: preferredTagName })
    await createDeck(page, deckName, [tagName])

    await openDeckDetailFromList(page, deckName)
    await expect(tagChipOnDeckDetail(page, tagName)).toBeVisible()
  })

  test('should persist deck tags after reload', async ({ page }) => {
    const deckName = uniqueName('DeckTagReload')
    const preferredTagName = uniqueName('ReloadTag')

    await createDeck(page, deckName)
    const tagName = await ensureAndVerifyTagViaLibrary(page, { name: preferredTagName })
    await openDeckEditFromList(page, deckName)
    await selectTagsInDeckForm(page, [tagName])
    await submitDeckForm(page)

    await openDeckDetailFromList(page, deckName)
    await expect(tagChipOnDeckDetail(page, tagName)).toBeVisible()

    await page.reload()
    await expect(tagChipOnDeckDetail(page, tagName)).toBeVisible()
  })
})
