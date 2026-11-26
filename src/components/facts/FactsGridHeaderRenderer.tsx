import type { IHeaderParams } from 'ag-grid-community'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

interface FactsGridHeaderRendererProps extends IHeaderParams {
  autoFocus?: boolean
  onBlur?: () => void
  onChange?: (uid: string, newName: string) => void
}


export default function FactsGridHeaderRenderer(props: FactsGridHeaderRendererProps) {
  const [editing, setEditing] = useState(!!props.autoFocus)
  const [value, setValue] = useState(props.displayName)
  const inputRef = useRef<HTMLInputElement>(null)
  const uid = () => {
    return props.column.getColDef().context?.uid
  }

  const startEdit = () => {
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const stopEdit = () => {
    setEditing(false)
    props.onBlur?.()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    props.onChange?.(uid(), e.target.value)
  }

  useEffect(() => {
    if (props.autoFocus) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [props.autoFocus])

  return (
    <div
      onDoubleClick={startEdit}
      className={clsx(
        'flex-1 h-full items-center flex group w-full facts-grid-header-renderer',
        !editing && 'py-2',
      )}
    >
      {editing
        ? (
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
            className="facts-grid-header-input"
          />
        )
        : <span>{value}</span>}
    </div>
  )
}
