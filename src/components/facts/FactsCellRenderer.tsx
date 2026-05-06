import { rawSymbol } from '@/components/facts/token'
import { Fact } from '@/modules/facts/facts.schema'
import { Dropdown, Key, Label, Tooltip } from '@heroui/react'
import { ICellRendererParams } from 'ag-grid-community'
import { EllipsisVertical, Eye, Paperclip, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface FactsCellRendererProps extends ICellRendererParams {
  onAttachmentClick?: (fact: Fact, fieldIndex: number) => void
}

export function FactsCellRenderer(props: FactsCellRendererProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()

  const handleAttachmentClick = useCallback(() => {
    const currentFact = props.data?.[rawSymbol] as Fact
    const allColumns = props.api.getAllDisplayedColumns()
    const fieldIndex = allColumns.findIndex((col) => col === props.column)
    props.onAttachmentClick?.(currentFact, fieldIndex)
  }, [props])


  function handleAction(key: Key){
    switch(key){
      case 'detail':{
        router.push(`${pathname}/${props.data?.id}`)
        break
      }
    }
  }

  if (props.colDef?.context?.isActionColumn) {
    return (
      <div className="flex items-center justify-center w-full  h-full">
        <Dropdown>
          <Dropdown.Trigger>
            <EllipsisVertical className="size-4 text-muted" />
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu onAction={handleAction}>
              <Dropdown.Item id="detail" textValue="detail" variant="default">
                <div className="flex items-center gap-1">
                  <Eye className="size-3.5 text-muted-foreground" />
                  <Label>{t('common.detail')}</Label>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="edit" textValue="edit">
                <div className="flex items-center gap-1">
                  <Pencil className="size-3.5 text-muted-foreground" />
                  <Label>{t('common.edit')}</Label>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="delete" variant="danger">
                <div className="flex items-center gap-1">
                  <Trash2 className="size-3.5 text-danger" />
                  <Label>{t('common.delete')}</Label>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    )
  }


  return (
    <div className="flex items-center  h-full">
      <span className="truncate">{props.getValue?.()}</span>
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
