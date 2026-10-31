import { rawSymbol } from '@/components/facts/token'
import type { Fact } from '@/modules/facts/facts.schema'

type RowData = Record<string, unknown> & { [rawSymbol]?: Fact }

/** Drop a deleted column’s field key and keep raw entries index-aligned with remaining columns. */
export function spliceDeletedFieldFromRow(
  data: RowData,
  deleteIndex: number,
  deletedFieldKey: string | undefined,
): RowData {
  const next: RowData = { ...data }
  if (deletedFieldKey) {
    delete next[deletedFieldKey]
  }
  const rawData = next[rawSymbol]
  if (rawData?.entries) {
    const entries = [...rawData.entries]
    entries.splice(deleteIndex, 1)
    next[rawSymbol] = { ...rawData, entries }
  }
  return next
}
