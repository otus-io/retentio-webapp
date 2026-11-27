import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FactsSheetApi } from '@/components/facts/FactsSpreadsheet'
import FactsSpreadsheet from '@/components/facts/FactsSpreadsheet'

// jsdom has no layout or ResizeObserver: give the host a size and keep the observer's callback to call by hand.
let resize: () => void = () => {}
class FakeResizeObserver {
  constructor(callback: () => void) {
    resize = callback
  }
  observe() {}
  disconnect() {}
}

function sized(el: Element, width: number, height: number) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: height })
}

function setup(rows = [['f0', 'b0'], ['', ''], ['f2', 'b2'], ['', '']], readOnlyRows = [1]) {
  const props = {
    headers: ['Front', 'Back'],
    rows,
    readOnlyRows,
    onReady: vi.fn(),
    onCellsChange: vi.fn(),
    onRowsInsert: vi.fn(),
    onHeaderRename: vi.fn(),
    onVisibleRowsChange: vi.fn(),
    onCellContextMenu: vi.fn(),
    onRowsDelete: vi.fn(),
    onEditEnd: vi.fn(),
  }
  const view = render(<FactsSpreadsheet {...props} />)
  const host = view.container.querySelector('.facts-sheet')!
  sized(host, 900, 400)
  return { props, view, host }
}

async function ready(rows?: string[][], readOnlyRows?: number[]) {
  const s = setup(rows, readOnlyRows)
  await waitFor(() => expect(s.props.onReady).toHaveBeenCalled())
  const api = s.props.onReady.mock.calls[0][0] as FactsSheetApi
  const sheet = s.host.firstElementChild as HTMLElement & { spreadsheet: { worksheets: any[] } }
  const worksheet = sheet.spreadsheet.worksheets[0]
  const td = (x: number, y: number) => s.host.querySelector<HTMLElement>(`tbody td[data-x="${x}"][data-y="${y}"]`)!
  const header = (x: number) => s.host.querySelector<HTMLElement>(`thead td[data-x="${x}"]`)!
  return { ...s, api, worksheet, td, header }
}

describe('FactsSpreadsheet', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the headers and rows, with the given rows read-only', async () => {
    const { td, header } = await ready()
    expect([header(0).textContent, header(1).textContent]).toEqual(['Front', 'Back'])
    expect(td(0, 0).textContent).toBe('f0')
    expect(td(1, 2).textContent).toBe('b2')
    expect(td(0, 1).classList.contains('readonly')).toBe(true)
    expect(td(0, 0).classList.contains('readonly')).toBe(false)
  })

  it('shows text as text: no formulas, no HTML', async () => {
    const { td } = await ready([['=1+1', '<b>bold</b>'], ['', '']], [])
    expect(td(0, 0).textContent).toBe('=1+1')
    expect(td(1, 0).textContent).toBe('<b>bold</b>')
    expect(td(1, 0).querySelector('b')).toBeNull()
  })

  it('reports cells the user changes', async () => {
    const { props, worksheet } = await ready()
    act(() => worksheet.setValueFromCoords(1, 0, 'back'))
    expect(props.onCellsChange).toHaveBeenCalledWith([{ x: 1, y: 0, value: 'back' }])
  })

  it('adds a spare row below when the last row is typed into', async () => {
    const { props, worksheet } = await ready()
    act(() => worksheet.setValueFromCoords(0, 3, 'new'))
    expect(props.onRowsInsert).toHaveBeenCalledWith(4, 1)
    expect(worksheet.rows).toHaveLength(5)
  })

  it('pastes a block across cells and rows, adding rows but never columns', async () => {
    const { props, worksheet, td } = await ready()
    act(() => {
      worksheet.updateSelectionFromCoords(0, 3, 0, 3)
      worksheet.paste(0, 3, 'hello\tbonjour\textra\ncat\tchat')
    })
    // The rows the paste runs into, then the spare row below them.
    expect(props.onRowsInsert.mock.calls).toEqual([[4, 1], [5, 1]])
    expect(worksheet.headers).toHaveLength(2)
    expect([td(0, 3).textContent, td(1, 3).textContent, td(0, 4).textContent]).toEqual(['hello', 'bonjour', 'cat'])
    expect(props.onCellsChange).toHaveBeenCalledWith(expect.arrayContaining([
      { x: 0, y: 3, value: 'hello' },
      { x: 1, y: 4, value: 'chat' },
    ]))
  })

  it('skips read-only cells when pasting, and does not report them as changed', async () => {
    const { worksheet, td, props } = await ready()
    act(() => {
      worksheet.updateSelectionFromCoords(0, 0, 0, 0)
      worksheet.paste(0, 0, 'a\nb\nc')
    })
    expect([td(0, 0).textContent, td(0, 1).textContent, td(0, 2).textContent]).toEqual(['a', '', 'c'])
    expect(props.onCellsChange).toHaveBeenCalledWith([{ x: 0, y: 0, value: 'a' }, { x: 0, y: 2, value: 'c' }])
  })

  it('reports nothing when every cell changed was read-only', async () => {
    const { worksheet, props } = await ready()
    act(() => {
      worksheet.updateSelectionFromCoords(0, 1, 0, 1)
      worksheet.paste(0, 1, 'b')
    })
    expect(props.onCellsChange).not.toHaveBeenCalled()
  })

  it('has no undo', async () => {
    const { worksheet, td } = await ready()
    act(() => worksheet.setValueFromCoords(0, 0, 'changed'))
    act(() => worksheet.undo())
    expect(td(0, 0).textContent).toBe('changed')
  })

  describe('api', () => {
    it('writes rows and their read-only state without reporting an edit', async () => {
      const { props, api, td } = await ready()
      act(() => api.setRow(1, ['f1', 'b1']))
      expect(td(0, 1).textContent).toBe('f1')
      expect(td(0, 1).classList.contains('readonly')).toBe(false)
      act(() => api.setRow(2, ['', ''], true))
      expect(td(1, 2).classList.contains('readonly')).toBe(true)
      expect(props.onCellsChange).not.toHaveBeenCalled()
    })

    it('deletes rows and renames headers without reporting them', async () => {
      const { props, api, td, header, worksheet } = await ready()
      act(() => api.deleteRow(0))
      expect(worksheet.rows).toHaveLength(3)
      expect(td(0, 1).textContent).toBe('f2')
      act(() => api.setHeader(0, 'Word'))
      expect(header(0).textContent).toBe('Word')
      expect(props.onHeaderRename).not.toHaveBeenCalled()
      expect(props.onCellsChange).not.toHaveBeenCalled()
    })

    it('keeps the user from deleting rows in the sheet', async () => {
      const { worksheet, api } = await ready()
      act(() => api.deleteRow(0))
      expect(worksheet.options.allowDeleteRow).toBe(false)
      act(() => worksheet.deleteRow(0, 1))
      expect(worksheet.rows).toHaveLength(3)
    })

    it('scrolls a row to the top and tells the first row on screen', async () => {
      const { api, host, worksheet } = await ready()
      const content = host.querySelector<HTMLElement>('.jss_content')!
      Object.defineProperty(worksheet.rows[2].element, 'offsetTop', { value: 90 })
      Object.defineProperty(worksheet.rows[0].element, 'offsetHeight', { configurable: true, value: 30 })
      api.scrollToRow(2)
      expect(content.scrollTop).toBe(90)
      expect(api.firstVisibleRow()).toBe(3)
      // A row it does not have: stays put.
      api.scrollToRow(99)
      expect(content.scrollTop).toBe(90)
    })

    it('counts rows from the top before they have a height', async () => {
      const { api } = await ready()
      expect(api.firstVisibleRow()).toBe(0)
    })

    it('selects a cell and gives the sheet the keyboard until focus moves elsewhere', async () => {
      const { api, td, props } = await ready()
      expect(api.selectedRange()).toBeNull()
      act(() => api.focusCell(1, 2))
      expect(api.selectedRange()).toEqual({ x1: 1, y1: 2, x2: 1, y2: 2 })
      expect(td(1, 2).classList.contains('highlight')).toBe(true)
      // Focus inside the sheet keeps the keyboard: Delete clears the selected cell.
      fireEvent.focusIn(td(0, 0))
      fireEvent.keyDown(document, { key: 'Delete', keyCode: 46, which: 46 })
      expect(props.onCellsChange).toHaveBeenLastCalledWith([{ x: 1, y: 2, value: '' }])
      // Focus anywhere else takes it away: typing there leaves the sheet alone.
      act(() => api.setRow(2, ['f2', 'b2']))
      const outside = document.createElement('input')
      document.body.appendChild(outside)
      fireEvent.focusIn(outside)
      fireEvent.keyDown(document, { key: 'Delete', keyCode: 46, which: 46 })
      expect(td(1, 2).textContent).toBe('b2')
      outside.remove()
    })

    it('gives the keyboard back keeping a block selected', async () => {
      const { api, worksheet, props } = await ready()
      act(() => worksheet.updateSelectionFromCoords(1, 3, 0, 2))
      expect(api.selectedRange()).toEqual({ x1: 0, y1: 2, x2: 1, y2: 3 })
      const outside = document.createElement('input')
      document.body.appendChild(outside)
      fireEvent.focusIn(outside)
      outside.remove()
      act(() => api.focusSheet())
      expect(api.selectedRange()).toEqual({ x1: 0, y1: 2, x2: 1, y2: 3 })
      // The keyboard works again: Delete clears the block.
      act(() => api.setRow(2, ['f2', 'b2']))
      fireEvent.keyDown(document.body, { key: 'Delete', keyCode: 46, which: 46 })
      expect(props.onCellsChange).toHaveBeenLastCalledWith(expect.arrayContaining([{ x: 1, y: 2, value: '' }]))
    })

    it('keeps what was typed when locking the row being typed in', async () => {
      const { api, worksheet, td, props } = await ready()
      act(() => worksheet.openEditor(td(1, 0)))
      const input = td(1, 0).querySelector('input, textarea') as HTMLInputElement
      input.value = 'typed'
      act(() => api.setRow(0, ['f0', ''], true))
      expect(props.onCellsChange).toHaveBeenCalledWith([{ x: 1, y: 0, value: 'typed' }])
      expect(td(1, 0).textContent).toBe('typed')
      expect(td(1, 0).classList.contains('readonly')).toBe(true)
    })

    it('leaves a cell being typed into alone when writing its row', async () => {
      const { api, worksheet, td } = await ready()
      act(() => worksheet.openEditor(td(1, 0)))
      act(() => api.setRow(0, ['new front', 'new back']))
      expect(td(0, 0).textContent).toBe('new front')
      expect(td(1, 0).querySelector('input, textarea')).not.toBeNull()
      // Other rows are written whole.
      act(() => api.setRow(2, ['x', 'y']))
      expect(td(1, 2).textContent).toBe('y')
    })

    it('tells whether a cell is being edited, and when an editor has closed', async () => {
      const { api, worksheet, td, props } = await ready()
      expect(api.isEditing()).toBe(false)
      act(() => worksheet.openEditor(td(0, 0)))
      expect(api.isEditing()).toBe(true)
      act(() => worksheet.closeEditor(td(0, 0), true))
      await waitFor(() => expect(props.onEditEnd).toHaveBeenCalled())
      expect(api.isEditing()).toBe(false)
    })

    it('moves the selection by rows, never above the first', async () => {
      const { api, worksheet } = await ready()
      act(() => api.shiftSelection(-1))
      expect(api.selectedRange()).toBeNull()
      act(() => worksheet.updateSelectionFromCoords(0, 2, 1, 3))
      act(() => api.shiftSelection(-1))
      expect(api.selectedRange()).toEqual({ x1: 0, y1: 1, x2: 1, y2: 2 })
      act(() => api.shiftSelection(-5))
      expect(api.selectedRange()).toEqual({ x1: 0, y1: 0, x2: 1, y2: 0 })
    })

    it('marks the given rows, replacing the rows marked before', async () => {
      const { api, worksheet, host } = await ready()
      act(() => api.markRows([1]))
      act(() => api.markRows([2, 3, 99]))
      expect(worksheet.rows[2].element.classList.contains('facts-sheet-marked')).toBe(true)
      expect(host.querySelectorAll('.facts-sheet-marked')).toHaveLength(2)
      act(() => api.markRows([]))
      expect(host.querySelectorAll('.facts-sheet-marked')).toHaveLength(0)
    })

    it('adds empty rows at the end and reports them', async () => {
      const { api, props, worksheet } = await ready()
      act(() => api.appendRows(3))
      expect(worksheet.rows).toHaveLength(7)
      expect(props.onRowsInsert).toHaveBeenCalledWith(4, 3)
    })

    it('copies the selection as Ctrl+C does', async () => {
      const { api, worksheet } = await ready()
      const copy = vi.spyOn(worksheet, 'copy').mockImplementation(() => {})
      act(() => api.copySelection())
      expect(copy).toHaveBeenCalled()
    })

    it('pastes at the top-left of the selection, as the user would', async () => {
      const { api, props, td, worksheet } = await ready()
      act(() => api.pasteAtSelection('nothing selected'))
      expect(props.onCellsChange).not.toHaveBeenCalled()
      act(() => worksheet.updateSelectionFromCoords(1, 3, 0, 2))
      act(() => api.pasteAtSelection('x'))
      expect(td(0, 2).textContent).toBe('x')
      expect(props.onCellsChange).toHaveBeenCalledWith(expect.arrayContaining([{ x: 0, y: 2, value: 'x' }]))
    })
  })

  describe('rows selected by their numbers', () => {
    // A row-number click, and a shift-click to extend, as the user does them.
    const pickRows = (worksheet: any, from: number, to: number) => {
      const number = (y: number) => worksheet.rows[y].element.children[0]
      act(() => {
        fireEvent.mouseDown(number(from), { buttons: 1 })
        fireEvent.mouseUp(document.body)
        if (to !== from) {
          fireEvent.mouseDown(number(to), { buttons: 1, shiftKey: true })
          fireEvent.mouseUp(document.body)
        }
      })
    }
    const press = (key: string) => fireEvent.keyDown(document.body, { key })

    it('are listed, unlike a block of cells', async () => {
      const { api, worksheet, td } = await ready()
      expect(api.selectedRows()).toEqual([])
      pickRows(worksheet, 0, 2)
      expect(api.selectedRows()).toEqual([0, 1, 2])
      // A block of cells, even one as wide as the rows.
      act(() => {
        fireEvent.mouseDown(td(0, 0), { buttons: 1 })
        fireEvent.mouseDown(td(1, 2), { buttons: 1, shiftKey: true })
        fireEvent.mouseUp(document.body)
      })
      expect(api.selectedRows()).toEqual([])
    })

    it('stop being rows once the keyboard moves the selection, so Delete clears the cell', async () => {
      const { api, worksheet, td, props } = await ready()
      pickRows(worksheet, 0, 0)
      act(() => {
        fireEvent.keyDown(document.body, { key: 'ArrowDown', keyCode: 40, which: 40 })
      })
      expect(api.selectedRange()).toEqual({ x1: 0, y1: 1, x2: 0, y2: 1 })
      expect(api.selectedRows()).toEqual([])
      act(() => api.setRow(1, ['f1', 'b1']))
      fireEvent.keyDown(document.body, { key: 'Delete', keyCode: 46, which: 46 })
      expect(td(0, 1).textContent).toBe('')
      expect(props.onRowsDelete).not.toHaveBeenCalled()
    })

    it('are handed to the page for deleting when Delete or Backspace is pressed', async () => {
      const { props, worksheet, td } = await ready()
      pickRows(worksheet, 1, 2)
      press('Delete')
      press('Backspace')
      expect(props.onRowsDelete.mock.calls).toEqual([[[1, 2]], [[1, 2]]])
      // Other keys, cells instead of rows, an open editor, or the keyboard elsewhere: nothing.
      press('a')
      act(() => {
        fireEvent.mouseDown(td(0, 0), { buttons: 1 })
        fireEvent.mouseUp(document.body)
      })
      press('Delete')
      pickRows(worksheet, 1, 2)
      act(() => worksheet.openEditor(td(0, 2)))
      press('Delete')
      act(() => worksheet.closeEditor(td(0, 2), false))
      const outside = document.createElement('input')
      document.body.appendChild(outside)
      fireEvent.focusIn(outside)
      press('Delete')
      outside.remove()
      expect(props.onRowsDelete).toHaveBeenCalledTimes(2)
    })

    it('extend by dragging down the row numbers', async () => {
      const { api, worksheet } = await ready()
      const number = (y: number) => worksheet.rows[y].element.children[0]
      act(() => {
        fireEvent.mouseDown(number(0), { buttons: 1 })
        for (const y of [1, 2, 3]) fireEvent.mouseOver(number(y), { buttons: 1 })
        fireEvent.mouseUp(document.body)
      })
      expect(api.selectedRows()).toEqual([0, 1, 2, 3])
    })

    it('include a row number right-clicked, so Delete asks to delete it rather than clearing its cells', async () => {
      const { api, worksheet, td, props } = await ready()
      const number = worksheet.rows[2].element.children[0]
      act(() => {
        fireEvent.mouseDown(number, { buttons: 2 })
        fireEvent.contextMenu(number)
      })
      expect(api.selectedRows()).toEqual([2])
      press('Delete')
      expect(props.onRowsDelete).toHaveBeenCalledWith([2])
      expect(td(0, 2).textContent).toBe('f2')
      // Inside rows already picked: the pick stays.
      pickRows(worksheet, 1, 3)
      act(() => {
        fireEvent.mouseDown(number, { buttons: 2 })
        fireEvent.contextMenu(number)
      })
      expect(api.selectedRows()).toEqual([1, 2, 3])
      // Outside the rows picked: that row, which a shift-click then extends from.
      act(() => {
        fireEvent.mouseDown(worksheet.rows[0].element.children[0], { buttons: 2 })
        fireEvent.contextMenu(worksheet.rows[0].element.children[0])
      })
      expect(api.selectedRows()).toEqual([0])
      act(() => {
        fireEvent.mouseDown(worksheet.rows[1].element.children[0], { buttons: 1, shiftKey: true })
        fireEvent.mouseUp(document.body)
      })
      expect(api.selectedRows()).toEqual([0, 1])
      // Inside a block of cells: just that row.
      act(() => {
        fireEvent.mouseDown(td(0, 1), { buttons: 1 })
        fireEvent.mouseDown(td(1, 3), { buttons: 1, shiftKey: true })
        fireEvent.mouseUp(document.body)
      })
      act(() => {
        fireEvent.mouseDown(number, { buttons: 2 })
        fireEvent.contextMenu(number)
      })
      expect(api.selectedRows()).toEqual([2])
    })

    it('are no longer selected once the page selects a cell', async () => {
      const { api, worksheet } = await ready()
      pickRows(worksheet, 0, 1)
      act(() => api.focusCell(0, 0))
      expect(api.selectedRows()).toEqual([])
    })

    it('stops listening for Delete when it unmounts', async () => {
      const { props, worksheet, view } = await ready()
      pickRows(worksheet, 1, 1)
      view.unmount()
      press('Delete')
      expect(props.onRowsDelete).not.toHaveBeenCalled()
    })
  })

  describe('right-click', () => {
    function rightClick(el: Element) {
      fireEvent.mouseDown(el, { buttons: 2 })
      return fireEvent.contextMenu(el, { clientX: 40, clientY: 60 })
    }

    it('asks for the menu of a cell, in place of the browser and library menus', async () => {
      const { props, td } = await ready()
      expect(rightClick(td(1, 2))).toBe(false)
      expect(props.onCellContextMenu).toHaveBeenCalledWith({ x: 1, y: 2, clientX: 40, clientY: 60 })
      expect(document.querySelector('.jcontextmenu.jcontextmenu-focus')).toBeNull()
    })

    it('asks for the row menu on a row number', async () => {
      const { props, worksheet } = await ready()
      rightClick(worksheet.rows[2].element.children[0])
      expect(props.onCellContextMenu).toHaveBeenCalledWith({ x: null, y: 2, clientX: 40, clientY: 60 })
    })

    it('asks for nothing on a header', async () => {
      const { props, header } = await ready()
      rightClick(header(0))
      expect(props.onCellContextMenu).not.toHaveBeenCalled()
    })
  })

  describe('renaming a header', () => {
    const box = () => screen.getByRole('textbox')

    it('opens a box over the header on double-click and saves on Enter', async () => {
      const { props, header } = await ready()
      fireEvent.doubleClick(header(1))
      expect(box()).toHaveProperty('value', 'Back')
      fireEvent.change(box(), { target: { value: ' Meaning ' } })
      fireEvent.keyDown(box(), { key: 'Enter' })
      expect(props.onHeaderRename).toHaveBeenCalledWith(1, 'Meaning')
      expect(header(1).textContent).toBe('Meaning')
      expect(screen.queryByRole('textbox')).toBeNull()
    })

    it('gives the keyboard back to the sheet once the box closes', async () => {
      const { props, header, worksheet, td } = await ready()
      act(() => worksheet.updateSelectionFromCoords(0, 0, 0, 0))
      fireEvent.doubleClick(header(0))
      fireEvent.focusIn(box())
      fireEvent.keyDown(box(), { key: 'Enter' })
      fireEvent.keyDown(document.body, { key: 'Delete', keyCode: 46, which: 46 })
      expect(td(0, 0).textContent).toBe('')
      expect(props.onCellsChange).toHaveBeenCalledWith([{ x: 0, y: 0, value: '' }])
    })

    it('saves when the box loses focus, once', async () => {
      const { props, header } = await ready()
      fireEvent.doubleClick(header(0))
      fireEvent.change(box(), { target: { value: 'Word' } })
      fireEvent.blur(box())
      expect(props.onHeaderRename).toHaveBeenCalledTimes(1)
    })

    it('cancels on Escape, even as the box blurs while closing', async () => {
      const { props, header } = await ready()
      fireEvent.doubleClick(header(0))
      const input = box()
      fireEvent.change(input, { target: { value: 'Word' } })
      // Both before the box is gone.
      act(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      })
      expect(props.onHeaderRename).not.toHaveBeenCalled()
      expect(header(0).textContent).toBe('Front')
    })

    it('keeps the name when it is left empty or unchanged', async () => {
      const { props, header } = await ready()
      fireEvent.doubleClick(header(0))
      fireEvent.change(box(), { target: { value: '  ' } })
      fireEvent.keyDown(box(), { key: 'Enter' })
      fireEvent.doubleClick(header(0))
      fireEvent.keyDown(box(), { key: 'a' })
      fireEvent.keyDown(box(), { key: 'Enter' })
      expect(props.onHeaderRename).not.toHaveBeenCalled()
      expect(header(0).textContent).toBe('Front')
    })

    it('ignores double-clicks outside the headers', async () => {
      const { td } = await ready()
      fireEvent.doubleClick(td(0, 0))
      expect(screen.queryByRole('textbox', { name: 'Front' })).toBeNull()
    })

    it('does nothing once the sheet is gone', async () => {
      const { props, header, view } = await ready()
      fireEvent.doubleClick(header(0))
      const input = box()
      fireEvent.change(input, { target: { value: 'Word' } })
      view.unmount()
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(props.onHeaderRename).not.toHaveBeenCalled()
    })
  })

  describe('layout', () => {
    it('shares the width between the columns, down to a minimum', async () => {
      const { host, worksheet } = await ready()
      const content = host.querySelector<HTMLElement>('.jss_content')!
      // The table: 50px of row numbers and borders, then the columns.
      Object.defineProperty(host.querySelector('table.jss_worksheet'), 'offsetWidth', {
        get: () => 50 + Number(worksheet.getWidth(0)) + Number(worksheet.getWidth(1)),
      })
      sized(content, 860, 400)
      act(() => resize())
      expect(content.style.width).toBe('900px')
      // Less the row numbers and the selection's corner handle.
      expect(worksheet.getWidth(0)).toBe(403)
      expect(worksheet.getWidth(1)).toBe(worksheet.getWidth(0))
      sized(content, 300, 400)
      act(() => resize())
      expect(worksheet.getWidth(0)).toBe(200)
      expect(worksheet.options.columns.map((c: { align: string }) => c.align)).toEqual(['left', 'left'])
    })

    it('fills the height it is given, also after growing', async () => {
      const { host } = await ready()
      const content = host.querySelector<HTMLElement>('.jss_content')!
      // The library adds 9px around its scroll area.
      Object.defineProperty(content, 'offsetHeight', { configurable: true, value: 100 })
      Object.defineProperty(host.firstElementChild, 'offsetHeight', { configurable: true, value: 109 })
      sized(host, 900, 700)
      act(() => resize())
      expect(content.style.height).toBe('691px')
      expect(content.style.maxHeight).toBe('691px')
      expect(content.style.boxShadow).toBe('none')
    })

    it('tells the page how many whole rows fit, when that changes', async () => {
      const { host, worksheet, props } = await ready()
      const content = host.querySelector<HTMLElement>('.jss_content')!
      Object.defineProperty(worksheet.rows[0].element, 'offsetHeight', { configurable: true, value: 25 })
      Object.defineProperty(host.querySelector('thead'), 'clientHeight', { configurable: true, value: 30 })
      sized(content, 860, 400)
      act(() => resize())
      expect(props.onVisibleRowsChange).toHaveBeenLastCalledWith(14)
      const calls = props.onVisibleRowsChange.mock.calls.length
      act(() => resize())
      expect(props.onVisibleRowsChange).toHaveBeenCalledTimes(calls)
    })
  })

  it('removes the sheet when it unmounts', async () => {
    const { view, host } = await ready()
    view.unmount()
    expect(host.children).toHaveLength(0)
  })

  it('does not start when it unmounts before the library loads', async () => {
    const { props, view } = setup()
    view.unmount()
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(props.onReady).not.toHaveBeenCalled()
  })
})
