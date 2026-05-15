
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
import AppButton, { AppButtonProps } from '@/components/app/AppButton'
import { CircleQuestionMark, Columns4Icon, RefreshCwIcon, Rows4Icon } from 'lucide-react'
import { updateFactsFields } from '@/api/facts'
import FactsMediaModal from '@/components/facts/FactsMediaModal'
import { actionSymbol, rawSymbol } from '@/components/facts/token'
import { useTranslations } from 'next-intl'
import LayoutPage from '@/components/layout/LayoutPage'
import { createFactsAction } from '@/modules/facts/facts.action'
import { Button } from '@heroui/react'
import clsx from 'clsx'
import AppTooltip from '@/components/app/AppTooltip'
import AppLink from '@/components/app/AppLink'

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
  const t = useTranslations()
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<Entry>()
  const gridRef = useRef<AgGridReact>(null)
  const [loading, setLoading]= useState(false)
  const fullFields = useMemo(() => {
    return [...deck.fields, actionSymbol]
  }, [deck.fields])
  const total = meta.total || 0
  const totalPages = meta.total ? Math.ceil(meta.total/meta.limit) :0

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
      headerName: isActionColumn? t('common.actions') : e as string,
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
      ...(isActionColumn
        ? {
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
        }
        :{
          editable: true,
          flex: 1,
          context: {
            uid: crypto.randomUUID(),
          },
        }),
    } satisfies ColDef<Record<string, any>>
  }, [handleRenameColDef, handleDebouncedFieldsChange, handleDeleteColDef, deck, handleAttachmentClick, t])

  const handleAddCol = useCallback(() => {
    const currentDefs = getCurrentColDefs()
    const uid = `field_${currentDefs.length}`
    const newCol= createColDef(uid)
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
        { href: '/decks', title: t('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/facts`, title: t('term.facts') },
      ]}
    >
      <div className="flex items-center gap-2 my-2">
        <div className="flex items-center gap-1">
          <span className="text-foreground text-base font-semibold">
            {t('common.all', { name: t('term.facts'), count: total })}
          </span>
          <AppTooltip content={ <p>{t('common.what-is', { name: t('term.facts') })}</p>}>
            <AppLink className="hover:text-accent" href={'/guide/getting-started/facts'}>
              <CircleQuestionMark className="size-4" />
            </AppLink>
          </AppTooltip>
        </div>

        <div className="ml-auto"></div>

        <CreateColButton
          isPending={loading}
          onClick={handleAddCol}
        />

        <CrateRowButton
          isPending={loading}
          deckId={deck.id}
          fields={fullFields}
        />

        <SyncButton
          onClick={handleDebouncedChange}
          isPending={loading}
        />
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
  isPending: isLoading,
}: {
  deckId: string,
  fields: (string | symbol)[]
  isPending: boolean
}){
  const t = useTranslations()
  const value = useMemo(() => {
    const _fields = fields.filter(isString)
    const facts = [{
      entries: _fields.map((text)=>({ text })),
    }]
    return JSON.stringify(facts)
  }, [fields])

  const [_state, action, isPending] = useActionState(createFactsAction.bind(null, deckId), null)

  return (
    <form action={action}>
      <input type="hidden" name="facts" value={value} />
      <input type="hidden" name="operation" value="prepend" />
      <AppTooltip
        content={t('common.add', { name: t('term.facts') })}
      >
        <AppButton
          size="sm"
          variant="outline"
          type="submit"
          isPending={isPending||isLoading}
          isIconOnly
          icon={<Rows4Icon className="size-4" />}
        />
      </AppTooltip>
    </form>
  )
}


function CreateColButton({ ...rest }: AppButtonProps){
  const t = useTranslations()
  return (
    <AppTooltip
      content={t('common.add', { name: t('term.field') })}
    >
      <AppButton
        className={'ml-auto'}
        size="sm"
        variant="outline"
        isIconOnly
        icon={<Columns4Icon className="size-4" />}
        {...rest}
      />
    </AppTooltip>
  )
}



function SyncButton({ ...rest }: AppButtonProps){
  const t = useTranslations()
  return (
    <AppTooltip
      content={t('common.sync')}
    >
      <Button
        size="sm"
        variant="outline"
        isIconOnly
        {...rest}
      >
        {
          ({ isPending })=><RefreshCwIcon className={clsx('size-4', isPending && 'animate-spin')} />
        }
      </Button>
    </AppTooltip>
  )
}
