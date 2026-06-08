import { test, expect } from '@playwright/test'
import {
  ensureAndVerifyTagViaLibrary,
  deleteTagViaLibrary,
  editTagViaLibrary,
  fillAndSubmitTagForm,
  gotoTagsPage,
  openTagLibraryCreateModal,
  skipUnlessE2ECredentials,
  tagChipOnLibrary,
  uniqueName,
} from './helpers'

test.describe('Tags library', () => {
  test.beforeEach(() => {
    skipUnlessE2ECredentials()
  })

  test('should navigate to tags page', async ({ page }) => {
    await gotoTagsPage(page)
    await expect(page).toHaveURL(/\/tags$/)
    await expect(page.getByText(/All Tags\(\d+\)/)).toBeVisible()
  })

  test('should create a tag', async ({ page }) => {
    const tagName = uniqueName('Tag')
    const description = 'E2E test description'

    await gotoTagsPage(page)
    await openTagLibraryCreateModal(page)
    await fillAndSubmitTagForm(page, { name: tagName, description })
    await expect(tagChipOnLibrary(page, tagName)).toBeVisible()

    await page.reload()
    await expect(tagChipOnLibrary(page, tagName)).toBeVisible()
  })

  test('should filter tags by search', async ({ page }) => {
    const tagA = uniqueName('AppleOnly')
    const tagB = uniqueName('BananaOnly')

    await ensureAndVerifyTagViaLibrary(page, { name: tagA })
    await ensureAndVerifyTagViaLibrary(page, { name: tagB })

    await page.getByRole('searchbox', { name: 'Search' }).fill(tagA)
    await expect.poll(async () => {
      const chips = page.locator('[data-slot="chip"]')
      const count = await chips.count()
      if (count !== 1) return false
      const text = await chips.first().textContent()
      return text?.includes(tagA) ?? false
    }).toBe(true)
    await expect(tagChipOnLibrary(page, tagA)).toBeVisible()

    await page.getByRole('searchbox', { name: 'Search' }).fill('')
    await expect(tagChipOnLibrary(page, tagA)).toBeVisible()
    await expect(tagChipOnLibrary(page, tagB)).toBeVisible()
  })

  test('should edit a tag', async ({ page }) => {
    const originalName = uniqueName('EditTag')
    const updatedName = uniqueName('UpdatedTag')

    await ensureAndVerifyTagViaLibrary(page, { name: originalName })
    await editTagViaLibrary(page, originalName, updatedName)

    await page.reload()
    await expect(tagChipOnLibrary(page, updatedName)).toBeVisible()
    await expect(tagChipOnLibrary(page, originalName)).toHaveCount(0)
  })

  test('should delete a tag', async ({ page }) => {
    const tagName = uniqueName('DeleteTag')

    await ensureAndVerifyTagViaLibrary(page, { name: tagName })
    await deleteTagViaLibrary(page, tagName)

    await page.reload()
    await expect(tagChipOnLibrary(page, tagName)).toHaveCount(0)
  })

  test('should reject duplicate tag names after normalization', async ({ page }) => {
    const baseName = uniqueName('DupTag')
    const duplicateName = `  ${baseName.toUpperCase()}  `

    await ensureAndVerifyTagViaLibrary(page, { name: baseName })
    await gotoTagsPage(page)
    await openTagLibraryCreateModal(page)
    await page.locator('input[name="name"]').fill(duplicateName)
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    await expect(tagChipOnLibrary(page, baseName)).toHaveCount(1)
  })
})
