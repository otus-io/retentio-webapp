import { ColDef, IHeaderParams } from 'ag-grid-community'
import { useRef, useState } from 'react'

export function FactsHeaderRenderer(props: IHeaderParams) {


  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(props.displayName)
  const inputRef = useRef<HTMLInputElement>(null)

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
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)

    // 更新 column headerName（关键）
    const colId = props.column.getColId()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.context?.updateColumnDefs?.((prev: ColDef<any>[]) =>
      prev.map((col) =>
        col.colId === colId ? { ...col, headerName: e.target.value } : col))
  }

  if (props.column.getColDef().context?.__isActionColumn__) {
    return (
      <div className="flex items-center justify-center w-full  h-full">
        {props.displayName}
      </div>
    )
  }

  return (
    <div
      onDoubleClick={startEdit}
      className="flex-1 h-full py-2 items-center flex"
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
        <span>{value}</span>
      )}
    </div>
  )
}
