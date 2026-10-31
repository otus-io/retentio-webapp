import { rawSymbol } from '@/components/facts/token'
import type { Entry, Fact } from '@/modules/facts/facts.schema'
import type { ColDef } from 'ag-grid-community'

/** Resolve the cell entry from row data and/or the fact snapshot (same path as attachments). */
export function resolveCellEntry(props: {
  data?: Record<string, unknown>
  column?: { getColId?: () => string } | null
  colDef?: { headerName?: string; field?: string } | null
  api?: { getColumnDefs?: () => ColDef[] | null | undefined }
}): Entry | undefined {
  const fieldKey = props.column?.getColId?.() ?? props.colDef?.field ?? ''
  const headerName = props.colDef?.headerName
  const fromField = fieldKey ? props.data?.[fieldKey] as Entry | undefined : undefined
  const fromHeader = headerName && headerName !== fieldKey
    ? props.data?.[headerName] as Entry | undefined
    : undefined

  const fact = props.data?.[rawSymbol] as Fact | undefined
  const allColumns = (props.api?.getColumnDefs?.() ?? []) as ColDef<Record<string, unknown>>[]
  const fieldIndex = fieldKey
    ? allColumns.findIndex((col) => (col.field ?? col.colId) === fieldKey)
    : -1
  const fromRaw = fieldIndex >= 0 ? fact?.entries[fieldIndex] : undefined

  for (const entry of [fromField, fromHeader, fromRaw]) {
    if (entry?.audio?.trim()) {
      return entry
    }
  }
  return fromField ?? fromHeader ?? fromRaw
}
