import AppTooltip from '@/components/app/AppTooltip'
import FactsAction from '@/components/facts/FactsAction'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Entry, Fact } from '@/modules/facts/facts.schema'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Paperclip } from 'lucide-react'

import { useCallback } from 'react'

interface FactsGridCellRendererProps extends ICellRendererParams {
  onAttachmentClick?: (fact: Fact, fieldKey: string, entry: Entry) => void
  deck: Deck
}

export default function FactsGridCellRenderer(props: FactsGridCellRendererProps) {
  const handleAttachmentClick = useCallback(() => {
    const currentFact = props.data?.[rawSymbol] as Fact
    const allColumns = (props.api.getColumnDefs() ?? []) as ColDef<Record<string, any>>[]
    const fieldKey = props.column?.getColId() ?? ''
    const fieldIndex = allColumns.findIndex((col) => col.field === fieldKey)
    const entry = fieldIndex >= 0 ? currentFact.entries[fieldIndex] : undefined
    if (entry) {
      props.onAttachmentClick?.(currentFact, fieldKey, entry)
    }
  }, [props])


  if (props.colDef?.context?.isActionColumn) {
    return (
      <div className="flex items-center w-full justify-center facts-grid-cell-renderer">
        <FactsAction deck={props.deck} fact={props.data} />
      </div>
    )
  }

  return (
    <div className="flex items-center h-full facts-grid-cell-renderer">
      <span className="truncate">{props.getValue?.()}</span>
      <AppTooltip
        trigger={false}
        content={<p>附件</p>}
      >
        <button
          type="button"
          tabIndex={0}
          className="facts-grid-cell-media ml-auto"
          style={{
            display: 'var(--cell-display, none)',
          }}
          onClick={() => handleAttachmentClick()}
        >
          <Paperclip
            className="size-3.5 hover:text-accent hover:cursor-pointer"
          />
        </button>
      </AppTooltip>
    </div>
  )
}
