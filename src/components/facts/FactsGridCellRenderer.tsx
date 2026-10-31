import AppTooltip from '@/components/app/AppTooltip'
import FactsAction from '@/components/facts/FactsAction'
import FactsAudioPlayButton from '@/components/facts/FactsAudioPlayButton'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
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

const playButtonClassName
  = 'facts-grid-cell-audio-play inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-default bg-background text-foreground hover:bg-default'

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

  const entry = resolveCellEntry(props)
  const audioId = entry?.audio?.trim()
  const fact = props.data?.[rawSymbol] as Fact | undefined

  return (
    <div className="flex items-center h-full min-w-0 w-full facts-grid-cell-renderer">
      <span className="truncate min-w-0">{props.getValue?.()}</span>
      <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
        {audioId
          ? (
            <FactsAudioPlayButton
              mediaId={audioId}
              deckId={props.deck.id}
              factId={fact?.id}
              imported={Boolean(props.deck.source_deck_id)}
              className={playButtonClassName}
            />
          )
          : null}
        <AppTooltip
          trigger={false}
          content={<p>附件</p>}
        >
          <button
            type="button"
            tabIndex={0}
            className="facts-grid-cell-media"
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
    </div>
  )
}
