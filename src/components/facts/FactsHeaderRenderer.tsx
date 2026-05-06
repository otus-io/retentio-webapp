import { Dropdown, Label } from '@heroui/react'
import { IHeaderParams } from 'ag-grid-community'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

interface FactsHeaderRendererProps extends IHeaderParams {
  autoFocus?: boolean
  onBlur?: () => void
  onChange?: (uid: string, newName: string) => void
  onDelete?: (uid: string) => void
}


export function FactsHeaderRenderer(props: FactsHeaderRendererProps) {
  const [editing, setEditing] = useState(!!props.autoFocus)
  const [value, setValue] = useState(props.displayName)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations()
  const uid = ()=>{
    return props.column.getColDef().context?.uid
  }

  // 进入编辑
  const startEdit = () => {
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  // 退出编辑
  const stopEdit = () => {
    setEditing(false)
    props.onBlur?.()
  }

  function handleAction(){
    props.onDelete?.(uid()!)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    props.onChange?.(uid(), e.target.value)
  }

  // autoFocus 时挂载后聚焦
  useEffect(() => {
    if (props.autoFocus) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [props.autoFocus]) // 只在 mount 时执行一次

  if (props.column.getColDef().context?.isActionColumn) {
    return (
      <div className="flex items-center justify-center w-full  h-full">
        {props.displayName}
      </div>
    )
  }

  return (
    <div
      onDoubleClick={startEdit}
      className="flex-1 h-full py-2 items-center flex group"
    >
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onBlur={stopEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              stopEdit()
            if (e.key === 'Escape')
              stopEdit()
          }}
          className="h-full"
        />
      ) : (
        <>
          <span>{value}</span>
          <Dropdown>
            <Dropdown.Trigger className={'ml-auto shrink-0'}>
              <EllipsisVertical className="size-4 text-muted" />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu onAction={handleAction}>
                <Dropdown.Item id="delete" textValue="delete" variant="danger">
                  <div className="flex items-center gap-1">
                    <Trash2 className="size-3.5 text-danger" />
                    <Label>{t('common.delete')}</Label>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </>
      )}
    </div>
  )
}
