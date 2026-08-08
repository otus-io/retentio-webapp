import { test, expect } from '@playwright/test'
import {
  addFactRow,
  createDeck,
  gotoDeckFacts,
  openDeckDetailFromList,
  skipUnlessE2ECredentials,
  uniqueName,
} from './helpers'
import { getTestUserAuthStatePath } from './global-setup'
import { t } from './i18n'

test.describe('Shared deck', () => {
  test('should show the shared deck catalog heading on the homepage', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: t('deck-sharing.heading') }),
    ).toBeVisible()
  })

  test('should navigate to the shared decks page with the search query', async ({ page }) => {
    await page.goto('/')

    const query = uniqueName('search')
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(query)
    await page.getByRole('button', { name: t('common.search') })
      .filter({ hasText: t('common.search') })
      .click()

    await expect(page).toHaveURL(new RegExp(`/decks/shared\\?query=${query}$`))
  })

  test('should update the url query when searching on the shared decks page', async ({ page }) => {
    await page.goto('/decks/shared')

    const query = uniqueName('search')
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(query)

    // The query param is written to the url with a debounce.
    await expect(page).toHaveURL(new RegExp(`query=${query}`))
  })

  test('should find the matching deck card when searching by name', async ({ page }) => {
    await page.goto('/decks/shared')

    const deckName = '大家的日语'
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(deckName)

    await expect(page.getByRole('link', { name: deckName })).toBeVisible()
  })
})

test.describe('Shared deck import', () => {
  test.use({ storageState: getTestUserAuthStatePath(2) })

  test.beforeEach(() => {
    skipUnlessE2ECredentials(2)
  })

  test('should import a shared deck and apply an update from the author', async ({ browser, page }, testInfo) => {
    test.setTimeout(90_000)
    const deckName = uniqueName('SharedDeckUpdate')
    const authorContext = await browser.newContext({
      baseURL: testInfo.project.use.baseURL as string,
      storageState: getTestUserAuthStatePath(1),
    })
    const authorPage = await authorContext.newPage()

    await createDeck(authorPage, deckName)
    await openDeckDetailFromList(authorPage, deckName)
    await authorPage.getByRole('button', { name: t('deck-sharing.publish') }).click()
    const publishDialog = authorPage.getByRole('dialog')
    await publishDialog.getByRole('button', { name: t('deck-sharing.publish') }).click()
    await expect(publishDialog).toBeHidden({ timeout: 15000 })
    await expect(authorPage.getByText('v1', { exact: true })).toBeVisible()

    await page.goto('/decks/shared')
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(deckName)
    const sharedDeck = page.locator('[data-slot="card"]').filter({ hasText: deckName })
    await expect(sharedDeck).toBeVisible()
    await sharedDeck.click()
    await page.waitForURL(/\/decks\/shared\/[^/]+$/)

    await page.getByRole('button', { name: t('deck-sharing.import') }).click()
    await page.waitForURL(/\/decks\/[^/]+$/)
    const importedDeckPath = new URL(page.url()).pathname

    await gotoDeckFacts(authorPage, deckName)
    await addFactRow(authorPage)
    await openDeckDetailFromList(authorPage, deckName)
    await authorPage.getByRole('button', { name: t('deck-sharing.republish') }).click()
    const republishDialog = authorPage.getByRole('dialog')
    await republishDialog.getByRole('textbox', {
      name: t('deck-sharing.version-label'),
    }).fill('2')
    await republishDialog.getByRole('button', { name: t('deck-sharing.republish') }).click()
    await expect(authorPage.getByText('v2', { exact: true })).toBeVisible({ timeout: 15000 })

    await page.reload()
    await expect(page.getByText(t('deck-sharing.updates-title'))).toBeVisible()
    const addedFacts = page.getByText(`${t('deck-sharing.added-facts')}（1）`, { exact: true })
    await expect(addedFacts).toBeVisible()
    await addedFacts.click()
    await page.getByRole('button', { name: t('deck-sharing.apply-updates') }).click()
    await expect(page.getByText(t('deck-sharing.up-to-date-title'))).toBeVisible({ timeout: 15000 })

    await authorContext.close()

    await page.goto('/decks')
    const importedDeck = page.locator('[data-slot="card"]').filter({
      has: page.locator(`a[href="${importedDeckPath}"]`),
    })
    await expect(importedDeck).toBeVisible()

    await importedDeck.locator('[data-slot="dropdown-trigger"]').click()
    await page
      .locator('[data-slot="dropdown-popover"] [data-slot="menu-item"][data-key="delete"]')
      .click()
    await page.getByRole('button', { name: t('common.confirm') }).click()

    await expect(importedDeck).toHaveCount(0, { timeout: 10000 })
  })
})
