'use client'

import 'jspreadsheet-ce/dist/jspreadsheet.css'
import 'jspreadsheet-ce/dist/jspreadsheet.themes.css'
import type jspreadsheet from 'jspreadsheet-ce'
import { useEffect, useRef, useState } from 'react'

type Worksheet = jspreadsheet.WorksheetInstance

/** Field columns share the width, but never get narrower than this; past it the sheet scrolls sideways. */
const MIN_COLUMN_WIDTH = 200
const CORNER_HANDLE_WIDTH = 4

/** What the facts page does to the sheet. Nothing done through it is reported back as an edit. */
export interface FactsSheetApi {
  /** Writes a row's texts; read-only rows take no typing or pasting. */
  setRow: (y: number, texts: string[], readOnly?: boolean) => void
  /** Adds empty rows at the end (reported through onRowsInsert like any other). */
  appendRows: (count: number) => void
  deleteRow: (y: number) => void
  setHeader: (x: number, title: string) => void
  /** Scrolls so the row sits at the top. */
  scrollToRow: (y: number) => void
  /** Selects the cell and gives the sheet the keyboard. */
  focusCell: (x: number, y: number) => void
  /** The selected block of cells, top-left to bottom-right; null when nothing is selected. */
  selectedRange: () => { x1: number; y1: number; x2: number; y2: number } | null
  /** Gives the sheet the keyboard back, keeping its selection. */
  focusSheet: () => void
  /** A cell editor is open (rows must not move under it). */
  isEditing: () => boolean
  /** The rows selected by their row numbers; none when cells are selected. */
  selectedRows: () => number[]
  /** Highlights these rows (none: no highlight). */
  markRows: (ys: number[]) => void
  /** Copies the selection to the clipboard, as Ctrl+C does. */
  copySelection: () => void
  /** Pastes text at the selection, as Ctrl+V does (and reported as the user's edit). */
  pasteAtSelection: (text: string) => void
  firstVisibleRow: () => number
}

export interface FactsSheetCellChange {
  x: number
  y: number
  value: string
}

export interface FactsSheetMenuRequest {
  /** The field column; null on the row-number column. */
  x: number | null
  y: number
  clientX: number
  clientY: number
}

interface FactsSheetProps {
  headers: string[]
  /** Starting rows; later changes go through the api. */
  rows: string[][]
  readOnlyRows: number[]
  onReady: (api: FactsSheetApi) => void
  /** Cells the user changed: typed, pasted, filled, cut or cleared. */
  onCellsChange: (changes: FactsSheetCellChange[]) => void
  /** Rows the sheet added at `y`: the spare row below the last, or rows a paste ran into. */
  onRowsInsert: (y: number, count: number) => void
  onHeaderRename: (x: number, title: string) => void
  /** How many whole rows fit on screen, when that changes. */
  onVisibleRowsChange: (rows: number) => void
  onCellContextMenu: (request: FactsSheetMenuRequest) => void
  /** Delete pressed with rows selected by their row numbers. */
  onRowsDelete: (ys: number[]) => void
  /** A cell editor closed. */
  onEditEnd: () => void
}

type Library = typeof jspreadsheet
interface PropsRef { current: FactsSheetProps }
interface SheetState {
  /** Set while the page writes to the sheet, so its own writes are not reported as edits. */
  quiet: boolean
}

function createWorksheet(lib: Library, sheet: HTMLElement, host: HTMLElement, propsRef: PropsRef, state: SheetState) {
  const { headers, rows } = propsRef.current
  const [worksheet] = lib(sheet as HTMLDivElement, {
    // Text stays text: no formulas, no HTML.
    parseFormulas: false,
    contextMenu: (ws, x, y, event, _items, role) => {
      event.preventDefault()
      // A right-clicked row number picks just that row, unless it is in rows already picked by their numbers (a block
      // of cells around it is not kept: its other rows are not what was clicked).
      const selection = ws as unknown as RowSelection
      if (role === 'row' && (selection.selectedRow == null || selection.selectedRow === false)) {
        // As the library selects a row-number row itself (no columns given).
        const none = null as unknown as number
        ws.updateSelectionFromCoords(none, Number(y), none, Number(y))
        selection.selectedRow = Number(y)
      }
      if (role === 'cell' || role === 'row') {
        propsRef.current.onCellContextMenu({
          x: role === 'cell' ? Number(x) : null,
          y: Number(y),
          clientX: event.clientX,
          clientY: event.clientY,
        })
      }
      // false skips the library's own menu; its types leave that value out.
      return false as unknown as null
    },
    onafterchanges: (_ws, changes) => {
      if (state.quiet) return
      // A read-only cell in a paste, cut or Delete keeps its text: the library reports it with no value.
      const changed = changes.filter((change) => change.value !== undefined)
      if (!changed.length) return
      propsRef.current.onCellsChange(changed.map((change) => ({
        x: Number(change.x),
        y: Number(change.y),
        value: String(change.value),
      })))
    },
    // The library marks rows picked by their numbers (click, shift-click, drag) but keeps the mark when the keyboard,
    // or the page, then selects a cell; those selections come without a mouse event.
    onselection: (ws, _x1, _y1, _x2, _y2, origin) => {
      if (!origin) (ws as unknown as RowSelection).selectedRow = null
    },
    // Told once the library has finished closing the editor.
    oneditionend: () => {
      setTimeout(() => propsRef.current.onEditEnd())
    },
    oninsertrow: (_ws, inserted) => {
      // Always reported, even for the page's own rows, so its rows stay in step with the sheet's.
      propsRef.current.onRowsInsert(inserted[0].row, inserted.length)
    },
    worksheets: [{
      data: rows,
      columns: headers.map((title) => ({ title, type: 'text', align: 'left', width: MIN_COLUMN_WIDTH })),
      // One empty row always follows the last row with text.
      minSpareRows: 1,
      tableOverflow: true,
      tableHeight: `${host.clientHeight}px`,
      tableWidth: `${host.clientWidth}px`,
      allowInsertColumn: false,
      allowManualInsertColumn: false,
      allowDeleteColumn: false,
      allowRenameColumn: false,
      allowManualInsertRow: false,
      allowDeleteRow: false,
      allowComments: false,
      columnSorting: false,
      columnDrag: false,
      rowDrag: false,
      // Rows keep one height (a press near a row number's bottom edge would otherwise resize it).
      rowResize: false,
    }],
  })
  // No undo: it could bring back a row whose fact was deleted on the server.
  worksheet.ignoreHistory = true
  return worksheet
}

/** Sizes the sheet to its host; returns the function to run again when the host is resized. */
function sheetLayout(worksheet: Worksheet, host: HTMLElement, propsRef: PropsRef) {
  const { headers } = propsRef.current
  const sheet = host.firstElementChild as HTMLElement
  const content = host.querySelector<HTMLElement>('.jss_content')!
  const table = host.querySelector<HTMLElement>('table.jss_worksheet')!
  const thead = table.querySelector('thead')!
  const rowHeight = () => worksheet.rows[0]?.element.offsetHeight || 1
  let columnWidth = MIN_COLUMN_WIDTH
  let visibleRows = 0
  return () => {
    // The library frames the sheet with a shadow; the page has its own edges.
    content.style.boxShadow = 'none'
    content.style.width = `${host.clientWidth}px`
    // The host's height, less what the library adds around the scroll area, so the sheet fits the space it is
    // given. (The library also caps the height at the one it started with.)
    const height = `${host.clientHeight - (sheet.offsetHeight - content.offsetHeight)}px`
    content.style.height = height
    content.style.maxHeight = height
    // Columns share the width left by the row numbers, the borders and the selection's corner handle (which sticks
    // out past the last column), so nothing scrolls sideways unless they would get narrower than the minimum.
    const overhead = table.offsetWidth - headers.length * columnWidth + CORNER_HANDLE_WIDTH
    columnWidth = Math.max(MIN_COLUMN_WIDTH, Math.floor((content.clientWidth - overhead) / headers.length))
    headers.forEach((_, x) => worksheet.setWidth(x, columnWidth))
    // The page fills the screen below the last fact with empty rows.
    const fit = Math.floor((content.clientHeight - thead.clientHeight) / rowHeight())
    if (fit !== visibleRows) {
      visibleRows = fit
      propsRef.current.onVisibleRowsChange(fit)
    }
  }
}

/** Set by a row-number click, cleared by a cell click; left out of the library's types. */
interface RowSelection { selectedRow?: number | false | null }

/** Rows picked by their numbers, not a block of cells. */
function selectedRowsOf(worksheet: Worksheet) {
  const { selectedRow } = worksheet as unknown as RowSelection
  return selectedRow == null || selectedRow === false ? [] : worksheet.getSelectedRows()
}

function sheetApi(lib: Library, worksheet: Worksheet, host: HTMLElement, propsRef: PropsRef, state: SheetState) {
  const { headers } = propsRef.current
  const content = host.querySelector<HTMLElement>('.jss_content')!
  const thead = host.querySelector('thead')!
  const quietly = (write: () => void) => {
    state.quiet = true
    try {
      write()
    } finally {
      state.quiet = false
    }
  }
  const setReadOnly = (y: number, readOnly: boolean) => {
    headers.forEach((_, x) => worksheet.setReadOnly(lib.helpers.getCellNameFromCoords(x, y), readOnly))
  }
  const api: FactsSheetApi = {
    setRow: (y, texts, readOnly = false) => {
      // A cell being typed into keeps what is typed (null leaves a cell as it is). Locking its row closes the editor
      // first, keeping the text (reported as the user's edit).
      const editing = worksheet.edition
      const editingX = editing && Number(editing[3]) === y ? Number(editing[2]) : -1
      if (readOnly && editingX >= 0) worksheet.closeEditor(editing![0], true)
      quietly(() => {
        worksheet.setRowData(y, texts.map((text, x) => (x === editingX ? null : text)), true)
        setReadOnly(y, readOnly)
      })
    },
    appendRows: (count) => {
      worksheet.insertRow(count)
    },
    // Rows go only with their facts: the user cannot delete one in the sheet (Delete on a row number would), so
    // deleting is allowed just for this call.
    deleteRow: (y) => quietly(() => {
      worksheet.options.allowDeleteRow = true
      try {
        worksheet.deleteRow(y, 1)
      } finally {
        worksheet.options.allowDeleteRow = false
      }
    }),
    setHeader: (x, title) => quietly(() => worksheet.setHeader(x, title)),
    scrollToRow: (y) => {
      const row = worksheet.rows[y]?.element
      if (row) content.scrollTop = row.offsetTop - thead.clientHeight
    },
    focusCell: (x, y) => {
      lib.current = worksheet
      worksheet.updateSelectionFromCoords(x, y, x, y)
    },
    focusSheet: () => {
      lib.current = worksheet
    },
    isEditing: () => Boolean(worksheet.edition),
    selectedRange: () => {
      const selected = worksheet.selectedCell
      if (!selected) return null
      const [x1, y1, x2, y2] = selected.map(Number)
      return { x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) }
    },
    selectedRows: () => selectedRowsOf(worksheet),
    copySelection: () => worksheet.copy(),
    pasteAtSelection: (text) => {
      const selected = worksheet.selectedCell
      if (!selected) return
      const [x1, y1, x2, y2] = selected.map(Number)
      worksheet.paste(Math.min(x1, x2), Math.min(y1, y2), text)
    },
    markRows: (ys) => {
      host.querySelectorAll('.facts-sheet-marked').forEach((row) => row.classList.remove('facts-sheet-marked'))
      ys.forEach((y) => worksheet.rows[y]?.element.classList.add('facts-sheet-marked'))
    },
    firstVisibleRow: () => Math.floor(content.scrollTop / (worksheet.rows[0]?.element.offsetHeight || 1)),
  }
  propsRef.current.readOnlyRows.forEach((y) => setReadOnly(y, true))
  return api
}

/** The facts spreadsheet (Jspreadsheet CE), mounted in the browser only. */
export default function FactsSpreadsheet(props: FactsSheetProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef(props)
  useEffect(() => {
    propsRef.current = props
  })
  const [renaming, setRenaming] = useState<{ x: number; title: string; rect: DOMRect } | null>(null)
  const renamingClosedRef = useRef(false)
  const worksheetRef = useRef<Worksheet | null>(null)

  useEffect(() => {
    const host = hostRef.current!
    let cancelled = false
    let jss: Library | undefined
    let observer: ResizeObserver | undefined
    const state: SheetState = { quiet: false }
    // Typing or pasting into anything outside the sheet (a dialog, the header box) must not reach it: the library
    // listens on the whole document while a sheet is selected.
    const handleFocusIn = (event: FocusEvent) => {
      if (jss && !host.contains(event.target as Node)) jss.current = null
    }
    // The library ignores Delete on selected rows (users cannot delete them in the sheet): the page deletes their
    // facts instead, after asking.
    const handleKeyDown = (event: KeyboardEvent) => {
      const worksheet = worksheetRef.current
      if (!jss || !worksheet || jss.current !== worksheet || worksheet.edition) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const rows = selectedRowsOf(worksheet)
      if (rows.length) propsRef.current.onRowsDelete(rows)
    }
    // Double-click a header to rename it in place.
    const handleDoubleClick = (event: MouseEvent) => {
      const cell = (event.target as HTMLElement).closest('thead td[data-x]')
      const worksheet = worksheetRef.current
      if (!cell || !worksheet) return
      const x = Number(cell.getAttribute('data-x'))
      renamingClosedRef.current = false
      setRenaming({ x, title: worksheet.getHeader(x), rect: cell.getBoundingClientRect() })
    }

    void import('jspreadsheet-ce').then(({ default: lib }) => {
      if (cancelled) return
      jss = lib
      const sheet = document.createElement('div')
      host.appendChild(sheet)
      const worksheet = createWorksheet(lib, sheet, host, propsRef, state)
      worksheetRef.current = worksheet
      const layout = sheetLayout(worksheet, host, propsRef)
      layout()
      observer = new ResizeObserver(layout)
      observer.observe(host)
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('focusin', handleFocusIn)
      host.addEventListener('dblclick', handleDoubleClick)
      propsRef.current.onReady(sheetApi(lib, worksheet, host, propsRef, state))
    })

    return () => {
      cancelled = true
      observer?.disconnect()
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('keydown', handleKeyDown)
      host.removeEventListener('dblclick', handleDoubleClick)
      const sheet = host.firstElementChild as jspreadsheet.JspreadsheetInstanceElement | null
      if (jss && sheet) jss.destroy(sheet, true)
      host.replaceChildren()
      worksheetRef.current = null
    }
  }, [])

  const commitRename = ({ x, title: typed }: { x: number; title: string }, save: boolean) => {
    // Enter or Escape closes the box, and closing it blurs it: only the first counts.
    if (renamingClosedRef.current) return
    renamingClosedRef.current = true
    const title = typed.trim()
    const worksheet = worksheetRef.current
    if (save && title && worksheet && title !== worksheet.getHeader(x)) {
      worksheet.setHeader(x, title)
      propsRef.current.onHeaderRename(x, title)
    }
    setRenaming(null)
  }

  return (
    <>
      <div ref={hostRef} className="facts-sheet size-full" />
      {renaming && (
        <input
          autoFocus
          aria-label={renaming.title}
          value={renaming.title}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setRenaming({ ...renaming, title: event.target.value })}
          onBlur={() => commitRename(renaming, true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitRename(renaming, true)
            if (event.key === 'Escape') commitRename(renaming, false)
          }}
          className="facts-grid-header-input fixed z-10"
          style={{
            left: renaming.rect.left,
            top: renaming.rect.top,
            width: renaming.rect.width,
            height: renaming.rect.height,
          }}
        />
      )}
    </>
  )
}
