'use client'

import { associateTagToFact, getAllTags, getFactTags, removeTagFromFact } from '@/api/tag'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'
import type { Tag as ITag } from '@/modules/tags/tags.schema'
import type { Key, Selection } from '@heroui/react'
import {
  EmptyState,
  Modal,
  SearchField,
  Spinner,
  Tag,
  TagGroup,
} from '@heroui/react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Fuse from 'fuse.js'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import TagFormModal from '@/components/tags/TagFormModal'
import { showFailToast } from '@/lib/ui'

interface FactsTagsModalProps {
  deck: Deck
  fact: Fact
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

export default function FactsTagsModal({ deck, fact, isOpen, setIsOpen }: FactsTagsModalProps) {
  const t = useTranslations()
  const [tags, setTags] = useState<ITag[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [keywords, setKeywords] = useState('')
  const deferredQuery = useDeferredValue(keywords)

  const fuse = useMemo(() => new Fuse(tags, { keys: ['name', 'description'] }), [tags])
  const results = useMemo(() => {
    if (!deferredQuery) return tags
    return fuse.search(deferredQuery).map((r) => r.item)
  }, [fuse, deferredQuery, tags])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const [allRes, factRes] = await Promise.all([
          getAllTags(),
          getFactTags(deck.id, fact.id),
        ])
        if (cancelled) return
        setTags(allRes.data.tags ?? [])
        setSelectedKeys(new Set((factRes.data.tags ?? []).map((tag) => tag.id)))
      }
      finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen, deck.id, fact.id])

  const associateTag = useCallback((key: Key) => {
    associateTagToFact(deck.id, fact.id, String(key)).catch((err) => {
      showFailToast(err)
      setSelectedKeys((s) => { const next = new Set(s); next.delete(key); return next })
    })
  }, [deck.id, fact.id])

  const removeTag = useCallback((key: Key) => {
    removeTagFromFact(deck.id, fact.id, String(key)).catch((err) => {
      showFailToast(err)
      setSelectedKeys((s) => new Set(s).add(key))
    })
  }, [deck.id, fact.id])

  const handleSelectionChange = useCallback((keys: Selection) => {
    if (keys === 'all') return
    const next = new Set(keys)
    const added = [...next].filter((key) => !selectedKeys.has(key))
    const removed = [...selectedKeys].filter((key) => !next.has(key))
    setSelectedKeys(next)
    added.forEach(associateTag)
    removed.forEach(removeTag)
  }, [associateTag, removeTag, selectedKeys])

  const handleTagCreated = useCallback((tag: ITag) => {
    setTags((prev) => (prev.some((item) => item.id === tag.id) ? prev : [...prev, tag]))
    if (selectedKeys.has(tag.id)) return
    setSelectedKeys((prev) => new Set(prev).add(tag.id))
    associateTag(tag.id)
  }, [associateTag, selectedKeys])

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t('term.tags')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-2 py-4 space-y-3">
              {isLoading
                ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                )
                :
                (
                  <>
                    <div className="flex items-center gap-1 ">
                      <SearchField
                        value={keywords}
                        onChange={setKeywords}
                        name="search"
                        variant="secondary"
                        aria-label={t('common.search')}
                        className="flex-1 pr-0"
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
                      <AppButton onClick={() => setFormOpen(true)} isIconOnly>
                        <Plus />
                      </AppButton>
                    </div>
                    {
                      tags.length === 0
                        ? (<EmptyState>{t('tags.empty')}</EmptyState>)
                        : results.length === 0
                          ? (<EmptyState>{t('common.no-data')}</EmptyState>)
                          : (
                            <>
                              <TagGroup
                                selectionMode="multiple"
                                selectedKeys={selectedKeys}
                                onSelectionChange={handleSelectionChange}
                                aria-label={t('term.tags')}
                                style={{
                                  '--radius': '.5rem',
                                }}
                              >
                                <TagGroup.List>
                                  {results.map((tag) => (
                                    <Tag key={tag.id} id={tag.id} textValue={tag.name}>
                                      {tag.name}
                                    </Tag>
                                  ))}
                                </TagGroup.List>
                              </TagGroup>
                            </>
                          )
                    }
                  </>
                )
              }
            </Modal.Body>
            <Modal.Footer>
              <AppButton slot="close" variant="secondary">
                {t('common.close')}
              </AppButton>

            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <TagFormModal
        tag={null}
        isOpen={formOpen}
        setIsOpen={setFormOpen}
        onSuccess={handleTagCreated}
      />
    </>
  )
}
