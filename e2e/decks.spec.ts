import { test, expect } from '@playwright/test'
import { createDeck } from './helpers'

test.describe('Decks', () => {
  test('should create a deck', async ({ page }) => {
    await createDeck(page)
    await expect(page).toHaveURL(/\/decks$/)
  })
})
