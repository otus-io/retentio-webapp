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
  /** The selected cell (the first of a selected block); null when nothing is selected. */
  selectedCell: () => { x: number; y: number } | null
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
    let jss: typeof jspreadsheet | undefined
    let observer: ResizeObserver | undefined
    let handleKeyDown: ((event: KeyboardEvent) => void) | undefined
    // Set while the page writes to the sheet, so its own writes are not reported as edits.
    let quiet = false
    const quietly = (write: () => void) => {
      quiet = true
      try {
        write()
      } finally {
        quiet = false
      }
    }
    // Typing or pasting into anything outside the sheet (a dialog, the header box) must not reach it: the library
    // listens on the whole document while a sheet is selected.
    const handleFocusIn = (event: FocusEvent) => {
      if (jss && !host.contains(event.target as Node)) jss.current = null
    }

    void import('jspreadsheet-ce').then(({ default: lib }) => {
      if (cancelled) return
      jss = lib
      const { headers, rows, readOnlyRows } = propsRef.current
      const sheet = document.createElement('div')
      host.appendChild(sheet)
      const [worksheet] = lib(sheet as unknown as HTMLDivElement, {
        // Text stays text: no formulas, no HTML.
        parseFormulas: false,
        contextMenu: (_ws, x, y, event, _items, role) => {
          event.preventDefault()
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
          if (quiet || !changes.length) return
          propsRef.current.onCellsChange(changes.map((change) => ({
            x: Number(change.x),
            y: Number(change.y),
            value: String(change.value ?? ''),
          })))
        },
        oninsertrow: (_ws, inserted) => {
          // Always reported, even for the page's own rows, so its rows stay in step with the sheet's.
          propsRef.current.onRowsInsert(inserted[0].row, inserted.length)
        },
        worksheets: [{
          data: rows,
          columns: headers.map((title) => ({ title, type: 'text', align: 'left', width: MIN_COLUMN_WIDTH })),
          // One empty row always follows the last fact; typing in it adds the fact.
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
        }],
      })
      // No undo: it could bring back a row whose fact was deleted on the server.
      worksheet.ignoreHistory = true
      worksheetRef.current = worksheet
      const cellName = (x: number, y: number) => lib.helpers.getCellNameFromCoords(x, y)
      const setReadOnly = (y: number, readOnly: boolean) => {
        headers.forEach((_, x) => worksheet.setReadOnly(cellName(x, y), readOnly))
      }
      readOnlyRows.forEach((y) => setReadOnly(y, true))

      const content = host.querySelector<HTMLElement>('.jss_content')!
      const table = host.querySelector<HTMLElement>('table.jss_worksheet')!
      const thead = table.querySelector('thead')!
      const rowHeight = () => worksheet.rows[0]?.element.offsetHeight || 1
      let columnWidth = MIN_COLUMN_WIDTH
      let visibleRows = 0
      const layout = () => {
        // The library frames the sheet with a shadow; the page has its own edges.
        content.style.boxShadow = 'none'
        content.style.width = `${host.clientWidth}px`
        // The host's height, less what the library adds around the scroll area, so the sheet fits the space it is
        // given. (The library also caps the height at the one it started with.)
        const height = `${host.clientHeight - (sheet.offsetHeight - content.offsetHeight)}px`
        content.style.height = height
        content.style.maxHeight = height
        // Columns share the width left by the row numbers, the borders and the selection's corner handle (which
        // sticks out past the last column), so nothing scrolls sideways unless they would get narrower than the minimum.
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
      layout()
      observer = new ResizeObserver(layout)
      observer.observe(host)

      // Rows picked by their numbers (the whole width, from a row-number click), not a block of cells.
      const selectedRows = () => {
        const selected = worksheet.selectedCell
        // Set by a row-number click, cleared by a cell click; left out of the library's types.
        const { selectedRow } = worksheet as unknown as { selectedRow?: number | false | null }
        const byNumber = selectedRow != null && selectedRow !== false
        if (!selected || !byNumber) return []
        const [x1, , x2] = selected.map(Number)
        if (Math.min(x1, x2) !== 0 || Math.max(x1, x2) !== headers.length - 1) return []
        return worksheet.getSelectedRows()
      }
      // The library ignores Delete on selected rows (users cannot delete them in the sheet): the page deletes their
      // facts instead, after asking.
      handleKeyDown = (event: KeyboardEvent) => {
        if (lib.current !== worksheet || worksheet.edition) return
        if (event.key !== 'Delete' && event.key !== 'Backspace') return
        const rows = selectedRows()
        if (rows.length) propsRef.current.onRowsDelete(rows)
      }
      document.addEventListener('keydown', handleKeyDown)

      // Double-click a header to rename it in place.
      host.addEventListener('dblclick', (event) => {
        const cell = (event.target as HTMLElement).closest('thead td[data-x]')
        if (!cell) return
        const x = Number(cell.getAttribute('data-x'))
        renamingClosedRef.current = false
        setRenaming({ x, title: worksheet.getHeader(x), rect: cell.getBoundingClientRect() })
      })
      document.addEventListener('focusin', handleFocusIn)

      propsRef.current.onReady({
        setRow: (y, texts, readOnly = false) => quietly(() => {
          worksheet.setRowData(y, texts, true)
          setReadOnly(y, readOnly)
        }),
        // Rows go only with their facts: the user cannot delete one in the sheet (Delete on a row number would),
        // so deleting is allowed just for this call.
        appendRows: (count) => {
          worksheet.insertRow(count)
        },
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
        selectedCell: () => {
          const selected = worksheet.selectedCell
          return selected ? { x: Number(selected[0]), y: Number(selected[1]) } : null
        },
        selectedRows,
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
        firstVisibleRow: () => Math.floor(content.scrollTop / rowHeight()),
      })
    })

    return () => {
      cancelled = true
      observer?.disconnect()
      document.removeEventListener('focusin', handleFocusIn)
      if (handleKeyDown) document.removeEventListener('keydown', handleKeyDown)
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
