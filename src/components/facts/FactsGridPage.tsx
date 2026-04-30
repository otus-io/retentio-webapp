/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { AgGridReact } from 'ag-grid-react'
import type { ColDef, IHeaderParams, IRowNode } from 'ag-grid-community'
import { Entry, Fact } from '@/modules/facts/facts.schema'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Deck } from '@/modules/decks/decks.schema'
import { ModuleRegistry } from 'ag-grid-community'
import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider } from 'ag-grid-react'
import { FactsCellRenderer } from '@/components/facts/FactsCellRenderer'
import { FactsHeaderRenderer } from '@/components/facts/FactsHeaderRenderer'
import { themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'
import { useTheme } from 'next-themes'
import TablePagination from '@/components/common/TablePagination'
import { useDebouncedCallback } from 'use-debounce'
import { updateDecksFields } from '@/api/decks'
import AppButton from '@/components/app/AppButton'
import { Plus, RefreshCcw } from 'lucide-react'
import { updateFactsFields } from '@/api/facts'

const lightTheme = themeQuartz.withPart(colorSchemeLight)
const darkTheme = themeQuartz.withPart(colorSchemeDark)
const modules = [AllCommunityModule]
ModuleRegistry.registerModules([AllCommunityModule])


const actionSymbol = Symbol('action')
const rawSymbol = Symbol('raw')


function isString(value?: string | symbol): value is string {
  return typeof value === 'string'
}

interface FactsGridPageProps {
  facts: Fact[]
  meta: PaginationMeta
  createHref?: string
  deck: Deck
}

export default function FactsGridPage({ facts, meta, deck }: FactsGridPageProps) {
  const total = meta.total || 0
  const { resolvedTheme } = useTheme()
  const gridRef = useRef<AgGridReact>(null)
  const [loading, setLoading]= useState(false)

  const fullFields = useMemo(() => {
    const factsFields= facts.reduce((longest, fact) =>
      fact.fields.length > longest.length ? fact.fields : longest
    , [] as string[])
    const fields = [...deck.fields].concat(...factsFields.filter((_, index)=>index>=deck.fields.length))
    return [...fields, actionSymbol]
  }, [deck.fields, facts])

  const lastDecksFields = useRef<string[]>(fullFields.filter((e)=>isString(e)) as string[])

  const rowData = useMemo(()=>{
    const data = facts.map((fact)=>{
      const result: Record<string, any> = {
        id: fact.id,
        [rawSymbol]: fact,
      }
      fullFields.forEach((key, index)=>{
        if(typeof key === 'string'){
          result[key] = fact.entries[index]
        }
      })
      return result
    })
    return data
  }, [facts, fullFields])


  const getCurrentColDefs = useCallback(() => {
    const currentDefs: ColDef<Record<string, any>>[] = gridRef.current?.api.getColumnDefs() ?? []
    return currentDefs
  }, [])


  const handleFieldsChange = useCallback(async (force=false) => {
    const currentDefs = getCurrentColDefs()
      .filter((def)=>!def.context.isActionColumn)
      .map((e)=>e.headerName || '')
    if(force || JSON.stringify(currentDefs) !== JSON.stringify(lastDecksFields.current)){
      setLoading(true)
      lastDecksFields.current = currentDefs
      await updateDecksFields(deck.id, {
        ...deck,
        fields: currentDefs,
      })
      setLoading(false)
    }
  }, [deck, getCurrentColDefs])

  const handleDebouncedFieldsChange = useDebouncedCallback(handleFieldsChange, 100)

  const getEntriesFromData = useCallback(
    (data: Record<string, Entry>) => {
      return getCurrentColDefs()
        .filter((def) => !def.context?.isActionColumn)
        .map((e) => {
          const key = e.headerName || ''
          return (data[key] ?? { text: '' }) as Entry
        })
    },
    [getCurrentColDefs],
  )
  const handleCellChange = useCallback(async () => {
    const changedNodes: { node: IRowNode; entries: Entry[] }[] = []
    gridRef.current?.api.forEachNode((node) => {
      const data = node.data
      const raw = data[rawSymbol] as Fact
      const entries = getEntriesFromData(data)
      const hasChanged = entries.some((entry, i) => {
        const rawEntry = raw.entries[i]
        return !rawEntry || entry.text !== rawEntry.text
      })
      if (hasChanged) {
        changedNodes.push({ node, entries })
      }
    })

    if (!changedNodes.length) return

    setLoading(true)
    try {
      await Promise.all(
        changedNodes.map(({ node, entries }) =>
          updateFactsFields(deck.id, node.data.id, { entries })),
      )

      // 批量更新 rawSymbol，仅在请求成功后
      changedNodes.forEach(({ node, entries }) => {
        node.data[rawSymbol].entries = entries
      })
    } finally {
      setLoading(false)
    }
  }, [deck.id, getEntriesFromData])

  const handleDebouncedCellChange = useDebouncedCallback(handleCellChange, 100)

  const handleDebouncedChange = useDebouncedCallback(()=>{
    handleFieldsChange(true)
    handleCellChange()
  }, 100)

  const handleRenameColDef = useDebouncedCallback((uid: string, newName: string) => {
    const currentDefs = getCurrentColDefs()
    const colDef = currentDefs.find((def) => def.context?.uid === uid)
    if (colDef) {
      colDef.headerName = newName
      gridRef.current?.api.setGridOption('columnDefs', [...currentDefs])
    }
  }, 100)

  const handleDeleteColDef = useCallback((uid: string) => {
    const currentDefs = getCurrentColDefs()
    const newDefs = currentDefs.filter((def) => def.context?.uid !== uid)
    console.log('删除列', uid, newDefs)
    gridRef.current?.api.setGridOption('columnDefs', newDefs)
    handleDebouncedFieldsChange()
  }, [getCurrentColDefs, handleDebouncedFieldsChange])

  const createColDef = useCallback((e: string | symbol) => {
    const isActionColumn = !isString(e)
    const colId: string = isActionColumn? 'action' : `${e as string}`
    return {
      field: colId,
      sortable: false,
      autoHeight: true,
      headerName: isActionColumn? '操作' : e as string,
      cellRenderer: FactsCellRenderer,
      valueGetter: (params)=>{
        const key = params.colDef.field ?? ''
        if(!isString(key)){
          return ''
        }
        const data = (params.data ?? {})[key] ?? {}
        return data?.text ?? ''
      },
      valueSetter: (params)=>{
        const key = params.colDef.field ?? ''
        if(!isString(key)){
          return false
        }
        const newValue = params.newValue
        params.data[key] = {
          ...params.data[key],
          text: newValue,
        }
        return true
      },
      headerComponent: (props: IHeaderParams)=>{
        return (
          <FactsHeaderRenderer
            {...props}
            autoFocus={true}
            onChange={handleRenameColDef}
            onBlur={handleDebouncedFieldsChange}
            onDelete={handleDeleteColDef}
          />
        )
      },
      ...(isActionColumn ? {
        pinned: 'right',
        suppressMovable: true,
        lockPosition: 'right',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        resizable: false,
        context: {
          isActionColumn: true,
        },
      }:{
        editable: true,
        flex: 1,
        context: {
          uid: crypto.randomUUID(),
        },
      }),
    } satisfies ColDef<Record<string, any>>
  }, [handleDeleteColDef, handleDebouncedFieldsChange, handleRenameColDef])

  const handleAddColDef = useCallback(() => {
    const currentDefs=getCurrentColDefs()
    const uid = `field_${currentDefs.length}`
    const newCol= createColDef(uid)
    // 插到 action 列前面
    const actionIndex = currentDefs.findIndex((def) => def.context?.isActionColumn)
    const newDefs = actionIndex === -1
      ? [
        ...currentDefs, newCol,
      ]
      : [
        ...currentDefs.slice(0, actionIndex),
        newCol,
        ...currentDefs.slice(actionIndex),
      ]
    gridRef.current?.api.setGridOption('columnDefs', newDefs)
  }, [createColDef, getCurrentColDefs])

  const colDefs = useMemo(()=>{
    return fullFields.map(createColDef)
  }, [fullFields, createColDef])




  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1>
          所有词组
        </h1>
        <AppButton
          className={'ml-auto'}
          size="sm"
          variant="outline"
          isPending={loading}
          onClick={handleAddColDef}
          icon={<Plus />}
        >
          创建列
        </AppButton>
        <AppButton
          className={''}
          size="sm"
          variant="outline"
          onClick={handleDebouncedChange}
          isPending={loading}
          icon={<RefreshCcw className="size-4" />}
        >
          {(props)=>{
            return props.isPending?'loading...':'save'
          }}
        </AppButton>
      </div>
      <AgGridProvider modules={modules}>
        <div style={{ height: 500 }}>
          <AgGridReact
            ref={gridRef}
            theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}
            suppressDragLeaveHidesColumns
            rowData={rowData}
            columnDefs={colDefs}
            onColumnMoved={()=>handleDebouncedFieldsChange()}
            onCellValueChanged={() => handleDebouncedCellChange()}
          />
        </div>
      </AgGridProvider>
      <TablePagination
        totalPages={total}
      />
    </div>
  )
}

