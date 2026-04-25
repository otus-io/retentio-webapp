'use client'

import { Fact } from '@/modules/facts/facts.schema'
import { Table, Chip, Dropdown, Label, Card, TableColumnProps } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { EllipsisVertical, Pencil, Trash2, Plus } from 'lucide-react'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import { useRouter } from 'next/navigation'
import TablePagination from '@/components/common/TablePagination'

interface FactsPageListProps {
  facts: Fact[]
  meta: PaginationMeta
  deckId: string
  createHref?: string
}

export default function FactsPageList({ facts, meta, deckId, createHref }: FactsPageListProps) {
  const t = useTranslations()
  const router = useRouter()
  const total = meta.total || 0
  const page = meta.offset + 1
  const pageSize = meta.limit
  const totalPages = Math.ceil(total / pageSize)

  const columns = useMemo(() => {
    const cols: {
      key: string;
      label: string;
      isRowHeader?: boolean
      defaultWidth?: TableColumnProps['defaultWidth']
      minWidth?: TableColumnProps['minWidth']
    }[] = []
    if (facts.length > 0 && facts[0].fields) {
      facts[0].fields.forEach((field, i) => {
        cols.push({ key: `entry_${i}`, label: field, isRowHeader: i === 0, defaultWidth: '1fr', minWidth: 100 })
      })
    }
    cols.push({ key: 'actions', label: t('facts.columns.actions'), defaultWidth: 80, minWidth: 80 })
    return cols
  }, [facts, t])


  const renderCell = useCallback((fact: Fact, columnKey: string) => {
    function handleAction(factId: string, action: string) {
      switch (action) {
        case 'edit':
          router.push(`/decks/${deckId}/facts/${factId}/edit`)
          break
        case 'delete':
          break
      }
    }


    if (columnKey.startsWith('entry_')) {
      const i = parseInt(columnKey.replace('entry_', ''), 10)
      const entry = fact.entries[i]
      if (!entry) return '-'
      if (entry.text) return entry.text
      if (entry.audio) return '[Audio]'
      if (entry.image) return '[Image]'
      if (entry.video) return '[Video]'
      return '-'
    }

    if (columnKey === 'tags') {
      if (fact.tags.length === 0) return null
      return (
        <div className="flex gap-1 flex-wrap">
          {fact.tags.slice(0, 3).map((tag) => (
            <Chip key={tag.id} size="sm" variant="secondary">
              {tag.name}
            </Chip>
          ))}
          {fact.tags.length > 3 && (
            <Chip size="sm" variant="secondary">+{fact.tags.length - 3}</Chip>
          )}
        </div>
      )
    }

    if (columnKey === 'actions') {
      return (
        <Dropdown>
          <Dropdown.Trigger>
            <EllipsisVertical className="size-4" />
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu onAction={(key) => handleAction(fact.id, key as string)}>
              <Dropdown.Item id="edit" textValue="edit">
                <div className="flex items-center gap-2">
                  <Pencil className="size-3.5 text-muted-foreground" />
                  <Label>{t('common.edit')}</Label>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="delete" variant="danger">
                <div className="flex items-center text-danger gap-2">
                  <Trash2 className="size-3.5" />
                  <Label>{t('common.delete')}</Label>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )
    }

    return null
  }, [deckId, router, t])

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold whitespace-nowrap">
            {t('facts.title')} ({total})
          </h1>
          {createHref && (
            <AppButtonLink
              href={createHref}
              className="shrink-0"
              size="sm"
              variant="outline"
              aria-label="Create Fact"
              isIconOnly
            >
              <Plus className="size-4 text-muted" />
            </AppButtonLink>
          )}
        </div>

        <Table variant="secondary">
          <Table.ResizableContainer>
            <Table.Content aria-label={t('facts.title')}>
              <Table.Header>
                {columns.map((column) => (
                  <Table.Column
                    key={column.key}
                    defaultWidth={column.defaultWidth}
                    minWidth={column.minWidth}
                    isRowHeader={column.isRowHeader}
                    className={'px-2 py-2'}
                  >
                    <Label className="line-clamp-1" title={column.label}>{column.label}</Label>
                    <Table.ColumnResizer />
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <Table.Row>
                    <Table.Cell colSpan={columns.length} className="text-center py-8  ">
                      {t('facts.empty')}
                    </Table.Cell>
                  </Table.Row>
                )}
              >
                <Table.Collection items={facts}>
                  {(fact) => (
                    <Table.Row key={fact.id} id={fact.id}>
                      {columns.map((column) => (
                        <Table.Cell key={`${fact.id}-${column.key}`} className="px-2 py-2">
                          <div title={column.label} className="line-clamp-1 text-sm  truncate" style={{ maxWidth: '100%' }}>
                            {renderCell(fact, column.key)}
                          </div>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  )}
                </Table.Collection>
              </Table.Body>
            </Table.Content>
          </Table.ResizableContainer>
          <Table.Footer>
            {
              totalPages > 1 && (
                <TablePagination totalPages={totalPages} pageSize={page} />
              )
            }
          </Table.Footer>
        </Table>
      </div>
    </Card>
  )
}
