import { test, expect } from '@playwright/test'
import { uniqueName } from './helpers'
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
