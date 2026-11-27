import { test, expect, type Page } from '@playwright/test'
import {
  editCell,
  factCell,
  renameColumn,
  uniqueName,
  factCellMenu,
  factIdCell,
  factsScroller,
  factsTopRow,
  focusedFactCellText,
  gotoSeededDeckFacts,
  skipUnlessE2ECredentials,
  typeIntoSelectedCell,
} from './helpers'

/** Right-clicks a cell at its centre and returns where the pointer was. */
async function rightClickCell(page: Page, cell: ReturnType<typeof factCell>) {
  const box = (await cell.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.click(x, y, { button: 'right' })
  return { x, y }
}

/**
 * The items of the open menu when exactly one is open, next to the pointer; otherwise a short reason, so
 * `expect.poll` keeps retrying while a replaced menu is still on its way out.
 */
async function menuItemsAt(page: Page, pointer: { x: number; y: number }) {
  const menu = factCellMenu(page)
  if (await menu.count() !== 1) return `menus: ${await menu.count()}`
  const box = await menu.boundingBox()
  if (!box) return 'menu not laid out'
  if (Math.abs(box.x - pointer.x) >= 30 || Math.abs(box.y - pointer.y) >= 30) return 'menu away from the pointer'
  return menu.locator('[data-slot="menu-item"]').allTextContents()
}

test.describe('Facts sheet', () => {
  test.beforeEach(() => {
    skipUnlessE2ECredentials()
    test.setTimeout(90_000)
  })

  test('downloads every fact in the background, so scrolling anywhere shows no blank rows', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetLoad', 450)
    await expect(factCell(page, 0, 0)).toHaveText('f0')
    // Every row is in the sheet, filled in the background.
    await expect.poll(() => page.locator('.jss_worksheet tbody tr').evaluateAll((rows) =>
      rows.slice(0, 450).filter((r, i) => r.children[1]?.textContent !== `f${i}`).length)).toBe(0)
    // The end, the middle and the top, twice.
    for (const row of [440, 225, 0, 440, 225, 0]) {
      await factsScroller(page).evaluate((el, y) => {
        el.scrollTop = el.querySelector<HTMLElement>(`tbody tr[data-y="${y}"]`)!.offsetTop
      }, row)
      await expect(factCell(page, row, 0)).toBeInViewport()
      await expect(factCell(page, row, 0)).toHaveText(`f${row}`)
    }
    // Only the sheet scrolls, never the page around it.
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await factsScroller(page).evaluate((el) => { el.scrollTop = el.scrollHeight })
    await expect(factCell(page, 449, 0)).toBeInViewport()
  })

  test('pasting lines from another spreadsheet fills cells and adds the lines past the end as facts', async ({
    page,
  }) => {
    await gotoSeededDeckFacts(page, 'SheetPaste', 2)
    await factCell(page, 1, 0).click()
    // What the browser hands the page for a paste of three rows copied from Excel or Google Sheets.
    await page.evaluate(() => {
      const data = new DataTransfer()
      data.setData('text/plain', 'one\tuno\textra\ntwo\tdos\nthree\ttres\n')
      document.activeElement!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))
    })
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    // No column for the extra cell.
    await expect(page.locator('.jss_worksheet thead td[data-x]')).toHaveCount(2)
    await page.reload()
    for (const [row, front, back] of [[1, 'one', 'uno'], [2, 'two', 'dos'], [3, 'three', 'tres']] as const) {
      await expect(factCell(page, row, 0)).toHaveText(front)
      await expect(factCell(page, row, 1)).toHaveText(back)
    }
  })

  test('copying a block gives tab-separated lines', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Reading the clipboard needs Chromium permissions')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await gotoSeededDeckFacts(page, 'SheetCopy', 3)
    await factCell(page, 0, 0).click()
    await factCell(page, 1, 1).click({ modifiers: ['Shift'] })
    await page.keyboard.press('ControlOrMeta+c')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('f0\tb0\nf1\tb1')
  })

  test('the end shows the last three facts at the top above empty rows; adding a fact keeps the view', async ({
    page,
  }) => {
    await gotoSeededDeckFacts(page, 'SheetEnd', 60)
    await page.locator('#facts-grid-create-row').click()
    await expect(factCell(page, 60, 0)).toHaveClass(/highlight-selected/)
    await expect.poll(() => factsTopRow(page)).toBe(57)
    // Empty rows fill the rest of the screen.
    const lastRowShown = await factsScroller(page).evaluate((el) => {
      const rows = [...el.querySelectorAll<HTMLElement>('tbody tr')]
      return rows.length > 63 && rows.at(-1)!.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom + 1
    })
    expect(lastRowShown).toBe(true)

    await typeIntoSelectedCell(page, 'added')
    await expect(page.getByText('All Facts(61)')).toBeVisible()
    // No jump: the view stays where it was.
    await expect.poll(() => factsTopRow(page)).toBe(57)
    // Scrolling as far as it goes now shows the new last three facts at the top.
    await factsScroller(page).evaluate((el) => { el.scrollTop = el.scrollHeight })
    await expect.poll(() => factsTopRow(page)).toBe(58)

    // The new fact got its id, so it saves when edited again.
    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH'
      && /\/facts\/[^/]+$/.test(r.url()) && (r.request().postData() ?? '').includes('added-back'))
    await editCell(page, factCell(page, 60, 1), 'added-back')
    expect((await saved).ok()).toBe(true)
  })

  test('right-clicking cells of a row one after another opens one menu at the pointer each time', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetMenu', 5)
    const fieldItems = ['Copy', 'Paste', 'Attachment', 'Tags', 'Delete']
    const steps = [
      { cell: factCell(page, 1, 0), items: fieldItems, focused: 'f1' },
      { cell: factCell(page, 1, 1), items: fieldItems, focused: 'b1' },
      { cell: factCell(page, 1, 0), items: fieldItems, focused: 'f1' },
      { cell: factIdCell(page, 1), items: ['Copy', 'Paste', 'Delete'], focused: 'f1' },
      { cell: factCell(page, 1, 1), items: fieldItems, focused: 'b1' },
      { cell: factCell(page, 3, 0), items: fieldItems, focused: 'f3' },
    ]
    for (const step of steps) {
      const pointer = await rightClickCell(page, step.cell)
      await expect.poll(() => menuItemsAt(page, pointer)).toEqual(step.items)
      expect(await focusedFactCellText(page)).toBe(step.focused)
    }
  })

  test('a click elsewhere closes the menu and focuses that cell; Escape returns to the menu cell', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetClose', 5)
    await rightClickCell(page, factCell(page, 1, 0))
    await expect(factCellMenu(page)).toHaveCount(1)
    await factCell(page, 4, 1).click()
    await expect(factCellMenu(page)).toHaveCount(0)
    await expect.poll(() => focusedFactCellText(page)).toBe('b4')

    await rightClickCell(page, factCell(page, 0, 0))
    await expect(factCellMenu(page)).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(factCellMenu(page)).toHaveCount(0)
    // The keyboard is back on that cell.
    await expect.poll(() => focusedFactCellText(page)).toBe('f0')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedFactCellText(page)).toBe('f1')
  })

  test('right-clicking a row id marks the whole row and offers copy, paste and delete', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetRow', 5)
    const row = page.locator('.jss_worksheet tbody tr[data-y="2"]')
    const marked = /facts-sheet-marked/
    const pointer = await rightClickCell(page, factIdCell(page, 2))
    await expect.poll(() => menuItemsAt(page, pointer)).toEqual(['Copy', 'Paste', 'Delete'])
    await expect(row).toHaveClass(marked)
    // Marked in a colour of its own.
    const plain = await factCell(page, 3, 0).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await factCell(page, 2, 0).evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(plain)

    // Still marked behind the confirmation; cancelling unmarks it.
    await factCellMenu(page).locator('[data-key="delete"]').click()
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
    await expect(row).toHaveClass(marked)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(row).not.toHaveClass(marked)
    await expect(page.getByText('All Facts(5)')).toBeVisible()
  })

  test('deleting from the row id menu removes the row in place', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetDelete', 5)
    await rightClickCell(page, factIdCell(page, 2))
    await factCellMenu(page).locator('[data-key="delete"]').click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    // The next fact moved up into the deleted row, and the row numbers stay in order.
    await expect(factCell(page, 2, 0)).toHaveText('f3')
    await expect(factCell(page, 3, 0)).toHaveText('f4')
    const numbers = await page.locator('.jss_worksheet tbody tr > td:first-child').allTextContents()
    expect(numbers).toEqual(numbers.map((_, i) => String(i + 1)))
  })

  test('Delete on rows selected by their numbers deletes their facts after one confirmation', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetDeleteRows', 6)
    await factIdCell(page, 1).click()
    await factIdCell(page, 3).click({ modifiers: ['Shift'] })
    await page.keyboard.press('Delete')
    await expect(page.getByRole('alertdialog')).toContainText('delete 3 items')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByText('All Facts(3)')).toBeVisible()
    await expect(factCell(page, 1, 0)).toHaveText('f4')
    await page.reload()
    await expect(factCell(page, 1, 0)).toHaveText('f4')
    await expect(factCell(page, 2, 0)).toHaveText('f5')
  })

  test('clearing every cell of a fact puts the text back instead of saving an empty fact', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetClearRow', 2)
    await factCell(page, 0, 0).click()
    await factCell(page, 0, 1).click({ modifiers: ['Shift'] })
    await page.keyboard.press('Delete')
    await expect(page.getByText("A fact can't be empty")).toBeVisible()
    await expect(factCell(page, 0, 0)).toHaveText('f0')
    await expect(factCell(page, 0, 1)).toHaveText('b0')
    await expect(page.getByText('All Facts(2)')).toBeVisible()
  })

  test('copy and paste from the right-click menu', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Reading the clipboard needs Chromium permissions')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await gotoSeededDeckFacts(page, 'SheetMenuPaste', 2)
    await factCell(page, 1, 0).click()
    await factCell(page, 1, 1).click({ modifiers: ['Shift'] })
    await rightClickCell(page, factCell(page, 1, 0))
    await factCellMenu(page).locator('[data-key="copy"]').click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('f1\tb1')
    // Into the empty row below the facts: a new fact.
    await factCell(page, 2, 0).click()
    await rightClickCell(page, factCell(page, 2, 0))
    await factCellMenu(page).locator('[data-key="paste"]').click()
    await expect(page.getByText('All Facts(3)')).toBeVisible()
    await expect(factCell(page, 2, 1)).toHaveText('b1')
  })

  test('every delete closes its confirmation, not only the first', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetDeleteTwice', 5)
    for (const remaining of [4, 3]) {
      // A deleted row slides out while the next one moves into its place; wait for that to settle.
      await expect(factIdCell(page, 1)).toHaveCount(1)
      await rightClickCell(page, factIdCell(page, 1))
      await factCellMenu(page).locator('[data-key="delete"]').click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText(`All Facts(${remaining})`)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Confirm' })).toHaveCount(0)
    }
    await expect(factCell(page, 1, 0)).toHaveText('f3')
  })

  test('a renamed column keeps its values after adding a fact, and later edits keep them too', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetRename', 3)
    await renameColumn(page, 0, uniqueName('Word'))
    await page.locator('#facts-grid-create-row').click()
    await expect(factCell(page, 3, 0)).toHaveClass(/highlight-selected/)
    await typeIntoSelectedCell(page, 'added')
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    await expect(factCell(page, 0, 0)).toHaveText('f0')

    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH'
      && /\/facts\/[^/]+$/.test(r.url()) && (r.request().postData() ?? '').includes('back!'))
    await editCell(page, factCell(page, 1, 1), 'back!')
    expect((await saved).ok()).toBe(true)
    await page.reload()
    await expect(factCell(page, 1, 0)).toHaveText('f1')
    await expect(factCell(page, 1, 1)).toHaveText('back!')
  })

  test('typing a new fact across columns saves every column', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetTypeAcross', 3)
    await page.locator('#facts-grid-create-row').click()
    await expect(factCell(page, 3, 0)).toHaveClass(/highlight-selected/)
    // The second column is saved with the create or, typed while the fact is created, right after it.
    const savedRingo = page.waitForResponse((r) => (r.request().postData() ?? '').includes('ringo') && r.ok(),
      { timeout: 15_000 })
    await page.keyboard.type('apple')
    await page.keyboard.press('Tab')
    await expect(factCell(page, 3, 1)).toHaveClass(/highlight-selected/)
    await typeIntoSelectedCell(page, 'ringo')
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    await savedRingo
    await page.reload()
    await expect(factCell(page, 3, 0)).toHaveText('apple')
    await expect(factCell(page, 3, 1)).toHaveText('ringo')
  })

  test('a dialog opened from the cell menu keeps the focus, and hands it back when closed', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetDialogFocus', 3)
    await rightClickCell(page, factCell(page, 1, 0))
    await factCellMenu(page).locator('[data-key="tag"]').click()
    const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Tags' }) })
    await expect(dialog).toBeVisible()
    // Past the frame in which a closing menu would hand focus back to its cell.
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
    await page.keyboard.type('zz')
    await expect(factCell(page, 1, 0).locator('input, textarea')).toHaveCount(0)
    await expect(factCell(page, 1, 0)).toHaveText('f1')

    // Closing it hands the keyboard back to the cell, so it keeps working in the sheet.
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => focusedFactCellText(page)).toBe('f1')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedFactCellText(page)).toBe('f2')
  })
})

