import { test, expect, type Page } from '@playwright/test'
import {
  factCell,
  renameColumn,
  uniqueName,
  factCellMenu,
  factIdCell,
  factsTopRow,
  focusedFactCellText,
  gotoSeededDeckFacts,
  skipUnlessE2ECredentials,
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

  test('downloads every fact in the background, so fast scrolling shows no blank rows', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetLoad', 450)
    await page.waitForLoadState('networkidle')
    await expect(factCell(page, 0, 0)).toHaveText('f0')
    // Record, every frame, the rendered fact rows that show no text while jumping between the top and the end.
    await page.evaluate(() => {
      const w = window as unknown as { blank: number[]; sampling: boolean }
      w.blank = []
      w.sampling = true
      const tick = () => {
        const rows = [...document.querySelectorAll('.ag-center-cols-container [role="row"]')]
        w.blank.push(rows.filter((r) => Number(r.getAttribute('row-index')) < 450 && !r.textContent?.trim()).length)
        if (w.sampling) requestAnimationFrame(tick)
      }
      tick()
    })
    const viewport = page.locator('.ag-body-viewport')
    for (let i = 0; i < 6; i++) {
      await viewport.evaluate((el, top) => { el.scrollTop = top ? 0 : el.scrollHeight }, i % 2)
      await page.waitForTimeout(150)
    }
    const blank = await page.evaluate(() => {
      const w = window as unknown as { blank: number[]; sampling: boolean }
      w.sampling = false
      return w.blank
    })
    expect(blank.length).toBeGreaterThan(10)
    expect(blank.filter((n) => n > 0)).toEqual([])
    await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight })
    await expect(factCell(page, 449, 0)).toHaveText('f449')
  })

  test('the end shows the last three facts at the top; adding a fact moves it down one row', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetEnd', 60)
    await page.locator('#facts-grid-create-row').click()
    const editor = page.locator('.ag-cell-inline-editing input')
    await expect(editor).toBeVisible()
    await expect.poll(() => factsTopRow(page)).toBe(57)

    await editor.fill('added')
    await editor.press('Enter')
    await expect(page.getByText('All Facts(61)')).toBeVisible()
    await expect.poll(() => factsTopRow(page)).toBe(58)
    // Scrolling as far as it goes stops at the same place.
    await page.locator('.ag-body-viewport').evaluate((el) => { el.scrollTop = el.scrollHeight })
    await expect.poll(() => factsTopRow(page)).toBe(58)

    // The new fact got its id, so it saves when edited again.
    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH'
      && /\/facts\/[^/]+$/.test(r.url()) && (r.request().postData() ?? '').includes('added-back'))
    await factCell(page, 60, 1).dblclick()
    await page.locator('.ag-cell-inline-editing input').fill('added-back')
    await page.locator('.ag-cell-inline-editing input').press('Enter')
    expect((await saved).ok()).toBe(true)
  })

  test('right-clicking cells of a row one after another opens one menu at the pointer each time', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetMenu', 5)
    const fieldItems = ['Attachment', 'Tags', 'Delete']
    const steps = [
      { cell: factCell(page, 1, 0), items: fieldItems, focused: 'f1' },
      { cell: factCell(page, 1, 1), items: fieldItems, focused: 'b1' },
      { cell: factCell(page, 1, 0), items: fieldItems, focused: 'f1' },
      { cell: factIdCell(page, 1), items: ['Delete'], focused: '2' },
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
    await expect.poll(() => focusedFactCellText(page)).toBe('f0')
  })

  test('right-clicking a row id marks the whole row and offers only delete', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetRow', 5)
    const row = page.locator('.ag-center-cols-container [row-index="2"]')
    const plain = await row.evaluate((el) => getComputedStyle(el).backgroundColor)
    const pointer = await rightClickCell(page, factIdCell(page, 2))
    await expect.poll(() => menuItemsAt(page, pointer)).toEqual(['Delete'])
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(plain)

    // Still marked behind the confirmation; cancelling unmarks it.
    await factCellMenu(page).locator('[data-key="delete"]').click()
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
    expect(await row.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(plain)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(plain)
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
    const numbers = await page.locator('.ag-pinned-left-cols-container [role="row"]').evaluateAll((rows) =>
      rows.map((r) => [Number(r.getAttribute('row-index')), r.textContent?.trim()] as const))
    expect(numbers.every(([index, text]) => text === String(index + 1))).toBe(true)
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
    const editor = page.locator('.ag-cell-inline-editing input')
    await editor.fill('added')
    await editor.press('Enter')
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    await expect(factCell(page, 0, 0)).toHaveText('f0')

    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH'
      && /\/facts\/[^/]+$/.test(r.url()) && (r.request().postData() ?? '').includes('back!'))
    await factCell(page, 1, 1).dblclick()
    await page.locator('.ag-cell-inline-editing input').fill('back!')
    await page.locator('.ag-cell-inline-editing input').press('Enter')
    expect((await saved).ok()).toBe(true)
    await page.reload()
    await expect(factCell(page, 1, 0)).toHaveText('f1')
    await expect(factCell(page, 1, 1)).toHaveText('back!')
  })

  test('typing a new fact across columns saves every column', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetTypeAcross', 3)
    await page.locator('#facts-grid-create-row').click()
    const editor = page.locator('.ag-cell-inline-editing input')
    await editor.fill('apple')
    await editor.press('Tab')
    await expect(page.locator('.ag-cell-inline-editing input')).toBeVisible()
    await page.locator('.ag-cell-inline-editing input').fill('ringo')
    await page.locator('.ag-cell-inline-editing input').press('Enter')
    await expect(page.getByText('All Facts(4)')).toBeVisible()
    // Saved once the new fact is known; then it survives a reload.
    await expect.poll(async () => {
      await page.reload()
      await expect(factCell(page, 3, 0)).toHaveText('apple')
      return factCell(page, 3, 1).textContent()
    }, { timeout: 15_000 }).toBe('ringo')
  })

  test('a dialog opened from the cell menu keeps the focus, and hands it back to the cell when closed', async ({ page }) => {
    await gotoSeededDeckFacts(page, 'SheetDialogFocus', 3)
    await rightClickCell(page, factCell(page, 1, 0))
    await factCellMenu(page).locator('[data-key="tag"]').click()
    const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Tags' }) })
    await expect(dialog).toBeVisible()
    // Past the frame in which a closing menu would hand focus back to its cell.
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
    await page.keyboard.type('zz')
    await expect(page.locator('.ag-cell-inline-editing')).toHaveCount(0)
    await expect(factCell(page, 1, 0)).toHaveText('f1')

    // Closing it hands focus back to the cell, so the keyboard keeps working in the grid.
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => focusedFactCellText(page)).toBe('f1')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedFactCellText(page)).toBe('f2')
  })
})

