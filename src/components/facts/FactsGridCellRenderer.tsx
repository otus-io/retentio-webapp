import AppTooltip from '@/components/app/AppTooltip'
import FactsAction from '@/components/facts/FactsAction'
import { resolveCellEntry } from '@/components/facts/resolveCellEntry'
import { rawSymbol } from '@/components/facts/token'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Entry, Fact } from '@/modules/facts/facts.schema'
import type { ICellRendererParams } from 'ag-grid-community'
import { Paperclip } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

interface FactsGridCellRendererProps extends ICellRendererParams {
  onAttachmentClick?: (fact: Fact, fieldKey: string, entry: Entry) => void
  deck: Deck
}

export default function FactsGridCellRenderer(props: FactsGridCellRendererProps) {
  const t = useTranslations()
  const handleAttachmentClick = useCallback(() => {
    const currentFact = props.data?.[rawSymbol] as Fact | undefined
    const fieldKey = props.column?.getColId() ?? props.colDef?.field ?? ''
    const entry = resolveCellEntry(props)
    if (currentFact && entry) {
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
  const hasMedia = Boolean(entry?.audio?.trim() || entry?.image?.trim() || entry?.video?.trim())

  return (
    <div className="flex items-center h-full min-w-0 w-full facts-grid-cell-renderer">
      <span className="truncate min-w-0">{props.getValue?.()}</span>
      <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
        <AppTooltip
          trigger={false}
          content={<p>{t('term.attachment')}</p>}
        >
          <button
            type="button"
            tabIndex={0}
            className="facts-grid-cell-media"
            style={{
              display: hasMedia ? 'block' : 'var(--cell-display, none)',
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
