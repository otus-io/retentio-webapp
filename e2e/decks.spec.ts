import { test, expect } from '@playwright/test'
import { createDeck, openDeckEditFromList, skipUnlessE2ECredentials, submitDeckForm, uniqueName } from './helpers'

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
})
