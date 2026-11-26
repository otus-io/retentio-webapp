/** Facts in the server-rendered first page. */
export const FACTS_FIRST_PAGE_SIZE = 100
/** Facts per background request: the backend's list maximum. */
export const FACTS_PAGE_SIZE = 200
/** Facts are always listed oldest first. */
export const FACTS_SORT = 'created_at'
/** Facts left at the top of the grid when it is scrolled to the end. */
export const FACTS_AT_END = 3

/**
 * Grid rows: scrolled to the end, the last FACTS_AT_END facts sit at the top and empty rows fill the rest of the
 * `visibleRows` on screen; there is always at least one empty row below the last fact.
 */
export function sheetRowCount(total: number, visibleRows: number) {
  return Math.max(total + 1, Math.max(0, total - FACTS_AT_END) + visibleRows)
}

/** The row to scroll to the top to show the end of the grid. */
export function endScrollRow(total: number) {
  return Math.max(0, total - FACTS_AT_END)
}

/**
 * Where to fetch next: the not-yet-loaded row nearest `anchor` (the first row on screen), widened back over the
 * unloaded rows just above it so one page covers them; null once every row is loaded.
 */
export function nextPageStart(isUnloaded: (index: number) => boolean, rowCount: number, anchor: number) {
  for (let d = 0; anchor + d < rowCount || anchor - d - 1 >= 0; d++) {
    const nearest = [anchor + d, anchor - d - 1].find((i) => i >= 0 && i < rowCount && isUnloaded(i))
    if (nearest === undefined) continue
    let start = nearest
    while (start > 0 && isUnloaded(start - 1) && nearest - start < FACTS_PAGE_SIZE - 1) start--
    return start
  }
  return null
}
