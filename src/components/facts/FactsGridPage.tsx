/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { Fact } from '@/modules/facts/facts.schema'
import { useMemo, useState } from 'react'
import { Deck } from '@/modules/decks/decks.schema'
import { ModuleRegistry } from 'ag-grid-community'
import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider } from 'ag-grid-react'
import { FactsCellRenderer } from '@/components/facts/FactsCellRenderer'
import { FactsHeaderRenderer } from '@/components/facts/FactsHeaderRenderer'
import { themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'
import { useTheme } from 'next-themes'
import TablePagination from '@/components/common/TablePagination'

const lightTheme = themeQuartz.withPart(colorSchemeLight)
const darkTheme = themeQuartz.withPart(colorSchemeDark)

const modules = [AllCommunityModule]

ModuleRegistry.registerModules([AllCommunityModule])

// 扩展 ColDef 类型
// declare module 'ag-grid-community' {
//   interface ColDef {
//     __isActionColumn__?: boolean
//   }
// }

interface FactsGridPageProps {
  facts: Fact[]
  meta: PaginationMeta
  createHref?: string
  deck: Deck
}

const actionSymbol = Symbol('action')

export default function FactsGridPage({ facts, meta, deck }: FactsGridPageProps) {
  const total = meta.total || 0
  const { resolvedTheme } = useTheme()

  const fullFields = useMemo(() => {
    const factsFields= facts.reduce((longest, fact) =>
      fact.fields.length > longest.length ? fact.fields : longest
    , [] as string[])
    const fields = [...deck.fields].concat(...factsFields.filter((e, index)=>index>=deck.fields.length))
    return [...fields, actionSymbol]
  }, [deck.fields, facts])


  const [rowData] = useState(()=>{
    const data = facts.map((fact)=>{
      const result: Record<string, any> = {
      }
      fullFields.forEach((key, index)=>{
        if(typeof key === 'string'){
          result[key] = fact.entries[index]?.text || ''
        }
      })
      return result
    })
    return data
  })

  const [colDefs] = useState<ColDef<Record<string, any>>[]>(()=>{
    return fullFields.map((e)=>{
      const isAction = typeof e === 'symbol' && e === actionSymbol
      const colId: string = isAction ? 'action' : `${e as string}`

      return {
        field: colId,
        sortable: false,
        cellRenderer: FactsCellRenderer,
        headerComponent: FactsHeaderRenderer,
        ...(isAction ? {
          pinned: 'right',
          suppressMovable: true,
          lockPosition: 'right',
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          resizable: false,
          context: {
            __isActionColumn__: true, // ← 自定义属性放这里
          },
        }:{
          editable: true,
        }),
      }
    })
  })


  return (
    <div className="p-4 space-y-4">
      <AgGridProvider modules={modules}>
        <div style={{ height: 500 }}>
          <AgGridReact
            theme={resolvedTheme === 'dark' ? darkTheme : lightTheme}
            suppressDragLeaveHidesColumns
            rowData={rowData}
            columnDefs={colDefs}
          />
        </div>
      </AgGridProvider>
      <TablePagination
        totalPages={total}
      />
    </div>
  )
}


