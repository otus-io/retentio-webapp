import AppButton from '@/components/app/AppButton'
import { Tooltip } from '@heroui/react'
import { ICellRendererParams } from 'ag-grid-community'
import { Paperclip, Trash2 } from 'lucide-react'

export function FactsCellRenderer(params: ICellRendererParams) {
  if (params.colDef?.context?.__isActionColumn__) {
    return (
      <div className="flex items-center justify-center w-full  h-full">
        <AppButton isIconOnly size="sm" variant="danger-soft">
          <Trash2 />
        </AppButton>
      </div>
    )
  }
  return (
    <div className="flex items-center h-full ">
      <span className="truncate">{params.getValue?.()}</span>
      <Tooltip delay={0}>
        <Tooltip.Trigger className=" ml-auto">
          <Paperclip
            style={{
              display: 'var(--cell-display, none)',
            }}
            className="size-3.5 hover:text-accent hover:cursor-pointer"
          />
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>附件</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  )
}
