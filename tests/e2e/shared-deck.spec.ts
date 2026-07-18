import { test, expect } from '@playwright/test'
import { skipUnlessE2ECredentials, uniqueName } from './helpers'
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

  test('should import the first shared deck and delete the imported deck', async ({ page }) => {
    await page.goto('/decks/shared')

    const firstSharedDeck = page.locator('[data-slot="card"]').first()
    await expect(firstSharedDeck).toBeVisible()
    await firstSharedDeck.click()
    await page.waitForURL(/\/decks\/shared\/[^/]+$/)

    await page.getByRole('button', { name: t('deck-sharing.import') }).click()
    await page.waitForURL(/\/decks\/[^/]+$/)
    const importedDeckPath = new URL(page.url()).pathname

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
