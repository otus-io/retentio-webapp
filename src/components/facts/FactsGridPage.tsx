/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { AgGridReact } from 'ag-grid-react'
import type { ColDef, IHeaderParams, IRowNode } from 'ag-grid-community'
import { Entry, Fact } from '@/modules/facts/facts.schema'
import { useActionState, useCallback, useMemo, useRef, useState } from 'react'
import { Deck } from '@/modules/decks/decks.schema'
import { ModuleRegistry } from 'ag-grid-community'
import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider } from 'ag-grid-react'
import FactsGridCellRenderer from '@/components/facts/FactsGridCellRenderer'
import FactsGridHeaderRenderer from '@/components/facts/FactsGridHeaderRenderer'
import { themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'
import { useTheme } from 'next-themes'
import TablePagination from '@/components/common/TablePagination'
import { useDebouncedCallback } from 'use-debounce'
import { updateDecksFields } from '@/api/decks'
import AppButton from '@/components/app/AppButton'
import { CheckIcon, Columns4Icon, ListIcon, Rows4Icon } from 'lucide-react'
import { updateFactsFields } from '@/api/facts'
import FactsMediaModal from '@/components/facts/FactsMediaModal'
import { actionSymbol, rawSymbol } from '@/components/facts/token'
import { useTranslations } from 'next-intl'
import LayoutPage from '@/components/layout/LayoutPage'
import { createFactsAction } from '@/modules/facts/facts.action'
import { AppButtonLink } from '@/components/app/AppButtonLink'

const lightTheme = themeQuartz.withPart(colorSchemeLight)
const darkTheme = themeQuartz.withPart(colorSchemeDark)
const modules = [AllCommunityModule]
ModuleRegistry.registerModules([AllCommunityModule])

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
  const { resolvedTheme } = useTheme()
  const total = meta.total || 0
  const totalPages = meta.total ? Math.ceil(meta.total/meta.limit) :0
  const [isOpen, setIsOpen] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<Entry>()
  const gridRef = useRef<AgGridReact>(null)
  const [loading, setLoading]= useState(false)
  const t = useTranslations()
  const fullFields = useMemo(() => {
    const factsFields= facts.reduce((longest, fact) =>
      fact.fields.length > longest.length ? fact.fields : longest
    , [] as string[])
    const fields = [...deck.fields].concat(...factsFields.filter((_, index) => index >= deck.fields.length))
    return [...fields, actionSymbol]
  }, [deck.fields, facts])

  const createRowData = useCallback((fact?: Fact) => {
    const result: Record<string, any> = {
      id: fact?.id,
      [rawSymbol]: fact,
    }
    fullFields.forEach((key, index)=>{
      if(typeof key === 'string'){
        if(!fact){
          result[key] = { text: key, audio: '', image: '', video: '' }
        }else{
          result[key] = fact?.entries[index]
        }
      }
    })
    return result
  }, [fullFields])

  const lastDecksFields = useRef<string[]>(fullFields.filter((e)=>isString(e)) as string[])
  const rowData = useMemo(()=>{
    const data = facts.map(createRowData)
    return data
  }, [facts, createRowData])

  const getCurrentColDefs = useCallback(() => {
    const currentDefs: ColDef<Record<string, any>>[] = gridRef.current?.api.getColumnDefs() ?? []
    return currentDefs
  }, [])

  const handleFieldsChange = useCallback(async (force=false) => {
    const currentDefs = getCurrentColDefs()
      .filter((def) => !def.context.isActionColumn)
      .map((e) => e.headerName || '')
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

    try {
      setLoading(true)
      await Promise.all(changedNodes.map(({ node, entries }) => updateFactsFields(deck.id, node.data.id, { entries })))
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

  const handleAttachmentClick = useCallback((fact: Fact, fieldIndex: number) => {
    console.log(fact, fact.entries[fieldIndex])
    setCurrentEntry(fact.entries[fieldIndex])
    setIsOpen(true)
  }, [setIsOpen])

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
      headerComponent: (props: IHeaderParams)=>{
        return (
          <FactsGridHeaderRenderer
            {...props}
            autoFocus={true}
            onChange={handleRenameColDef}
            onBlur={handleDebouncedFieldsChange}
            onDelete={handleDeleteColDef}
          />
        )
      },
      cellRenderer: (props: any)=>{
        return <FactsGridCellRenderer deck={deck} {...props} onAttachmentClick={handleAttachmentClick} />
      },
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
      ...(isActionColumn ? {
        pinned: 'right',
        suppressMovable: true,
        lockPosition: 'right',
        width: 75,
        minWidth: 75,
        maxWidth: 75,
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
  }, [handleRenameColDef, handleDebouncedFieldsChange, handleDeleteColDef, deck, handleAttachmentClick])

  const handleAddCol = useCallback(() => {
    const currentDefs = getCurrentColDefs()
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




  const columnDefs = useMemo(()=>{
    return fullFields.map(createColDef)
  }, [fullFields, createColDef])

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('nav.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/facts`, title: '词组' },
      ]}
    >
      <div className="flex items-center gap-2 my-2">
        <h1>
          所有词组（{total}）
        </h1>
        <AppButton
          className={'ml-auto'}
          size="sm"
          variant="outline"
          isPending={loading}
          onClick={handleAddCol}
          icon={<Columns4Icon className="size-4" />}
        >
          <span>创建列</span>
        </AppButton>

        <CrateRowButton deckId={deck.id} fields={fullFields} />


        <AppButtonLink
          size="sm"
          variant="outline"
          href={`/decks/${deck.id}/facts/create`}
        >
          <ListIcon className="size-4" />
          <span>创建facts</span>
        </AppButtonLink>
        <AppButton
          className={''}
          size="sm"
          variant="outline"
          onClick={handleDebouncedChange}
          isPending={loading}
          icon={<CheckIcon className="size-4" />}
        >
          {(props)=>{
            return props.isPending?'保存中...':'保存'
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
            columnDefs={columnDefs}
            onColumnMoved={()=>handleDebouncedFieldsChange()}
            onCellValueChanged={() => handleDebouncedCellChange()}
          />
        </div>
      </AgGridProvider>
      <TablePagination
        totalPages={totalPages}
      />
      <FactsMediaModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        entry={currentEntry}
      />
    </LayoutPage>
  )
}



function CrateRowButton({
  deckId,
  fields,
}: {
  deckId: string,
  fields: (string | symbol)[]
}){
  const value = useMemo(() => {
    const _fields = fields.filter(isString)
    const facts = [{
      entries: _fields.map((text)=>({ text })),
      fields: _fields,
    }]
    return JSON.stringify(facts)
  }, [fields])


  const [_state, action, isPending] = useActionState(createFactsAction.bind(null, deckId), null)

  console.log(_state)
  return (
    <form action={action}>
      <input type="hidden" name="facts" value={value} />
      <input type="hidden" name="operation" value="prepend" />
      <AppButton
        size="sm"
        variant="outline"
        type="submit"
        isPending={isPending}
        icon={<Rows4Icon className="size-4" />}
      >
        <span>创建行</span>
      </AppButton>
    </form>
  )
}
