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
    const authorDeckPath = new URL(authorPage.url()).pathname
    const sourceDeckId = authorDeckPath.split('/').at(-1)
    expect(sourceDeckId).toBeTruthy()

    await authorPage.goto(`/decks/shared/${sourceDeckId}`)
    const viewOwnDeckLink = authorPage.getByRole('link', {
      name: t('deck-sharing.view-my-deck'),
    })
    await expect(viewOwnDeckLink).toBeVisible()
    await expect(authorPage.getByRole('button', { name: t('deck-sharing.import') })).toHaveCount(0)
    await viewOwnDeckLink.click()
    await expect(authorPage).toHaveURL(authorDeckPath)

    await page.goto('/decks/shared')
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(deckName)
    await expect(page).toHaveURL(new RegExp(`query=${deckName}`))
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
    const addedFacts = page.getByText(`${t('deck-sharing.added-facts')} (1)`, { exact: true })
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

  test('should submit field rename and deck tag contributions for an imported deck', async ({ browser, page }, testInfo) => {
    test.setTimeout(120_000)
    const deckName = uniqueName('SharedDeckContributions')
    const proposedFields = [uniqueName('Front'), uniqueName('Back')]
    const proposedTag = uniqueName('contribution-tag')
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
    const authorDeckPath = new URL(authorPage.url()).pathname

    await page.goto('/decks/shared')
    await page.getByPlaceholder(t('deck-sharing.search-placeholder')).fill(deckName)
    await expect(page).toHaveURL(new RegExp(`query=${deckName}`))
    const sharedDeckLink = page.getByRole('link', { name: deckName })
    await expect(sharedDeckLink).toBeVisible()
    await sharedDeckLink.click()
    await page.waitForURL(/\/decks\/shared\/[^/]+$/)

    await page.getByRole('button', { name: t('deck-sharing.import') }).click()
    await page.waitForURL(/\/decks\/[^/]+$/)
    const importedDeckId = new URL(page.url()).pathname.split('/').at(-1)
    expect(importedDeckId).toBeTruthy()

    await page.getByRole('button', { name: t('contributions.field-rename-title') }).click()
    const fieldRenameDialog = page.getByRole('dialog', { name: t('contributions.field-rename-title') })
    await fieldRenameDialog.getByRole('textbox', {
      name: t('contributions.suggested-field', { number: 1 }),
    }).fill(proposedFields[0])
    await fieldRenameDialog.getByRole('textbox', {
      name: t('contributions.suggested-field', { number: 2 }),
    }).fill(proposedFields[1])
    await fieldRenameDialog.getByRole('button', { name: t('common.save') }).click()
    await expect(fieldRenameDialog).toBeHidden()
    await expect(page.getByRole('tab', {
      name: t('contributions.pending-tab', { count: 1 }),
    })).toBeVisible()

    await page.getByRole('button', { name: t('contributions.deck-tags-title') }).click()
    const deckTagsDialog = page.getByRole('dialog', { name: t('contributions.deck-tags-title') })
    await deckTagsDialog.getByRole('textbox', { name: t('contributions.add-tags') }).fill(proposedTag)
    await deckTagsDialog.getByRole('button', { name: t('common.save') }).click()
    await expect(deckTagsDialog).toBeHidden()

    await expect(page.getByRole('tab', {
      name: t('contributions.pending-tab', { count: 2 }),
    })).toBeVisible()
    await page.getByRole('columnheader').first().locator('[data-slot="checkbox-control"]').click()
    const submitButton = page.getByRole('button', {
      name: t('contributions.submit-selected', { count: 2 }),
    })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    await expect(page.getByRole('tab', {
      name: t('contributions.sent-tab', { count: 2 }),
    })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(proposedFields.join(' · '), { exact: true })).toBeVisible()
    await expect(page.getByText(`+${proposedTag}`, { exact: true })).toBeVisible()

    const sentKinds = await page.evaluate((storageKey) => {
      const items = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as { kind?: string }[]
      return items.map((item) => item.kind).sort()
    }, `retentio_sent_contribs_v1:${importedDeckId}`)
    expect(sentKinds).toEqual(['deck_tags', 'field_rename'])

    await authorPage.reload()
    await expect(authorPage.getByText(t('author-contributions.title'), { exact: true })).toBeVisible()
    const fieldRenameRow = authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.field_rename'),
    })
    await expect(fieldRenameRow).toBeVisible()
    await fieldRenameRow.getByRole('button', {
      name: t('author-contributions.accept-proposal'),
    }).click()
    await expect(fieldRenameRow).toHaveCount(0, { timeout: 15000 })

    const deckTagRow = authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.deck_tag_update'),
    })
    await expect(deckTagRow).toBeVisible()
    await deckTagRow.getByRole('button', { name: t('author-contributions.dismiss') }).click()
    await expect(deckTagRow).toHaveCount(0, { timeout: 15000 })

    await authorPage.getByRole('tab', { name: t('author-contributions.tabs.accepted') }).click()
    await expect(authorPage).toHaveURL(/contributionStatus=accepted/)
    await expect(authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.field_rename'),
    })).toBeVisible()

    await authorPage.getByRole('tab', { name: t('author-contributions.tabs.dismissed') }).click()
    await expect(authorPage).toHaveURL(/contributionStatus=dismissed/)
    await expect(authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.deck_tag_update'),
    })).toBeVisible()

    const resolvedTag = uniqueName('resolved-tag')
    await page.getByRole('button', { name: t('contributions.deck-tags-title') }).click()
    const secondDeckTagsDialog = page.getByRole('dialog', { name: t('contributions.deck-tags-title') })
    await secondDeckTagsDialog.getByRole('textbox', { name: t('contributions.add-tags') }).fill(resolvedTag)
    await secondDeckTagsDialog.getByRole('button', { name: t('common.save') }).click()
    await page.getByRole('columnheader').first().locator('[data-slot="checkbox-control"]').click()
    await page.getByRole('button', {
      name: t('contributions.submit-selected', { count: 1 }),
    }).click()
    await expect(page.getByText(`+${resolvedTag}`, { exact: true })).toBeVisible({ timeout: 15000 })

    await authorPage.goto(authorDeckPath)
    const secondDeckTagRow = authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.deck_tag_update'),
    })
    await expect(secondDeckTagRow).toBeVisible()
    await secondDeckTagRow.getByRole('button', {
      name: t('author-contributions.mark-resolved'),
    }).click()
    await expect(secondDeckTagRow).toHaveCount(0, { timeout: 15000 })

    await authorPage.getByRole('tab', { name: t('author-contributions.tabs.resolved') }).click()
    await expect(authorPage).toHaveURL(/contributionStatus=resolved/)
    await expect(authorPage.getByRole('row').filter({
      hasText: t('author-contributions.types.deck_tag_update'),
    })).toBeVisible()

    await authorContext.close()
  })
})
