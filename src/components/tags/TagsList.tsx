'use client'

import type { Tag } from '@/modules/tags/tags.schema'
import { useTranslations } from 'next-intl'
import { TagIcon, Plus } from 'lucide-react'
import { useDeferredValue, useMemo, useState, useCallback } from 'react'
import TagFormModal from '@/components/tags/TagFormModal'
import TagItem from '@/components/tags/TagItem'
import Fuse from 'fuse.js'
import LayoutPage from '@/components/layout/LayoutPage'
import { SearchField } from '@heroui/react'
import AppButton from '@/components/app/AppButton'

export default function TagsList({ data }: { data: Tag[] }) {
  const t = useTranslations()
  const [keywords, setKeywords] = useState('')
  const deferredQuery = useDeferredValue(keywords)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const openCreate = useCallback(() => {
    setEditingTag(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((tag: Tag) => {
    setEditingTag(tag)
    setModalOpen(true)
  }, [])

  const fuse = useMemo(() => new Fuse(data, { keys: ['name', 'description'] }), [data])

  const results = useMemo(() => {
    if (!deferredQuery) return data
    return fuse.search(deferredQuery).map((r) => r.item)
  }, [fuse, deferredQuery, data])

  return (
    <LayoutPage breadcrumbs={[{ href: '/tags', title: t('term.tags') }]}>
      <div className="md:flex gap-2 items-center my-2">
        <div className="flex flex-1 items-center gap-2 pl-1">
          <span className="text-foreground text-base font-semibold">
            {t('common.all', { name: t('term.tags'), count: data.length })}
          </span>
        </div>
        <div className="flex mt-2 md:mt-0 md:ml-auto items-center gap-2 min-w-0 ml-0">
          <SearchField
            value={keywords}
            onChange={setKeywords}
            name="search"
            aria-label={t('common.search')}
            className="flex-1"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input
                aria-label={t('common.search')}
                placeholder={t('common.search')}
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <AppButton variant="outline" size="sm" isIconOnly onPress={openCreate}>
            <Plus className="text-muted" />
          </AppButton>
        </div>
      </div>

      {results.length === 0
        ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted">
            <TagIcon size={48} />
            <p>{t('common.no-data')}</p>
          </div>
        )
        : (
          <div className="flex flex-wrap gap-2 mt-4">
            {results.map((tag) => (
              <TagItem
                key={tag.id}
                tag={tag}
                highlight={deferredQuery}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}

      <TagFormModal
        key={editingTag?.id ?? 'create'}
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        tag={editingTag}
      />
    </LayoutPage>
  )
}
