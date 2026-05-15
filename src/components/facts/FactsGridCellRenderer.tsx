import AppTooltip from '@/components/app/AppTooltip'
import FactsAction from '@/components/facts/FactsAction'
import { rawSymbol } from '@/components/facts/token'
import { Deck } from '@/modules/decks/decks.schema'
import { Fact } from '@/modules/facts/facts.schema'
import { ICellRendererParams } from 'ag-grid-community'
import { Paperclip } from 'lucide-react'

import { useCallback } from 'react'

interface FactsGridCellRendererProps extends ICellRendererParams {
  onAttachmentClick?: (fact: Fact, fieldIndex: number) => void
  deck: Deck
}

export default function FactsGridCellRenderer(props: FactsGridCellRendererProps) {
  const handleAttachmentClick = useCallback(() => {
    const currentFact = props.data?.[rawSymbol] as Fact
    const allColumns = props.api.getAllDisplayedColumns()
    const fieldIndex = allColumns.findIndex((col) => col === props.column)
    props.onAttachmentClick?.(currentFact, fieldIndex)
  }, [props])


  if (props.colDef?.context?.isActionColumn) {
    return (
      <div className="flex items-center w-full justify-center">
        <FactsAction deck={props.deck} fact={props.data} />
      </div>
    )
  }

  return (
    <div className="flex items-center  h-full">
      <span className="truncate">{props.getValue?.()}</span>
      <AppTooltip
        trigger={false}
        content={<p>附件</p>}
      >
        <button
          type="button"
          tabIndex={0}
          className=" ml-auto"
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
