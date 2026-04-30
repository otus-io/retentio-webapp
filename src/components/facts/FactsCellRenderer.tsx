import AppButton from '@/components/app/AppButton'
import { rawSymbol } from '@/components/facts/token'
import { Fact } from '@/modules/facts/facts.schema'
import { Tooltip } from '@heroui/react'
import { ICellRendererParams } from 'ag-grid-community'
import { Paperclip, Trash2 } from 'lucide-react'
import { useCallback } from 'react'

interface FactsCellRendererProps extends ICellRendererParams {
  onAttachmentClick?: (fact: Fact, fieldIndex: number) => void
}

export function FactsCellRenderer(params: FactsCellRendererProps) {
  const handleAttachmentClick = useCallback(() => {
    const currentFact = params.data?.[rawSymbol] as Fact
    const allColumns = params.api.getAllDisplayedColumns()
    const fieldIndex = allColumns.findIndex((col) => col === params.column)
    params.onAttachmentClick?.(currentFact, fieldIndex)
  }, [params])

  if (params.colDef?.context?.isActionColumn) {
    return (
      <div className="flex items-center justify-center w-full  h-full">
        <AppButton isIconOnly size="sm" variant="danger-soft">
          <Trash2 />
        </AppButton>
      </div>
    )
  }


  return (
    <div className="flex items-center  h-full">
      <span className="truncate">{params.getValue?.()}</span>
      <Tooltip
        delay={0}
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
        <Tooltip.Content>
          <p>附件</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  )
}
