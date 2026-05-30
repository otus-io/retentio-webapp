'use client'
import { getAllTags } from '@/api/tag'
import AppButton from '@/components/app/AppButton'
import TagFormModal from '@/components/tags/TagFormModal'
import type { Tag as ITag } from '@/modules/tags/tags.schema'

import type { Key } from '@heroui/react'

import {
  Autocomplete,
  EmptyState,
  Label,
  ListBox,
  SearchField,
  Spinner,
  Tag as Tag,
  TagGroup,
  useFilter,
} from '@heroui/react'
import { useAsyncList } from '@react-stately/data'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import clsx from 'clsx'

export default function TagPicker() {
  const t = useTranslations()
  const list = useAsyncList<ITag>({
    async load() {
      const res = await getAllTags()
      return {
        items: res.data.tags ?? [],
      }
    },
  })
  const items = list.items
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const { contains } = useFilter({ sensitivity: 'base' })
  const [modalOpen, setModalOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const onRemoveTags = (keys: Set<Key>) => {
    setSelectedKeys((prev) => prev.filter((key) => !keys.has(key)))
  }

  const handleCreateTag = useCallback(() => {
    setIsOpen(false)
    setModalOpen(true)
  }, [])

  const handleTagCreated = useCallback((tag: ITag) => {
    // 把新建的标签加入可选项并选中，保留已选项
    console.log('handleTagCreated', tag)
    list.append(tag)
    setSelectedKeys((prev) => {
      const result = (prev.includes(tag.id) ? prev : [...prev, tag.id])
      return result
    })
  }, [list])


  return (
    <>
      <Autocomplete
        allowsEmptyCollection
        placeholder={t('tags.select-placeholder')}
        selectionMode="multiple"
        value={selectedKeys}
        variant="secondary"
        onChange={(keys) => setSelectedKeys(keys as Key[])}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Label>{t('term.tags')}</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value>
            {({ defaultChildren, isPlaceholder, state }) => {
              if (isPlaceholder || state.selectedItems.length === 0) {
                return defaultChildren
              }

              const selectedItemsKeys = state.selectedItems.map((item) => item.key)
              return (
                <TagGroup size="sm" onRemove={onRemoveTags} aria-label="selected tag" variant="surface">
                  <TagGroup.List>
                    {selectedItemsKeys.map((selectedItemKey) => {
                      const selectedItem = items.find((item) => item.id === selectedItemKey)
                      if (!selectedItem) {
                        return null
                      }
                      return (
                        <Tag
                          key={selectedItem.id}
                          id={selectedItem.id}
                          aria-label={selectedItem.name}
                        >
                          <span>{selectedItem.name}</span>
                        </Tag>
                      )
                    })}
                  </TagGroup.List>
                </TagGroup>
              )
            }}
          </Autocomplete.Value>
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter filter={contains}>
            <div className="flex items-center gap-1 pr-3">
              <SearchField autoFocus name="search" variant="secondary" aria-label="search" className="flex-1 pr-0">
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder={t('tags.search-placeholder')} />
                  <Spinner
                    size="sm"
                    className={clsx('absolute top-1/2 right-2 -translate-y-1/2', {
                      'pointer-events-none opacity-0': !list.isLoading,
                    })}
                  />
                  <SearchField.ClearButton
                    className={clsx({ 'pointer-events-none opacity-0': !!list.isLoading })}
                  />
                </SearchField.Group>
              </SearchField>
              <AppButton isIconOnly onClick={() => handleCreateTag()}>
                <Plus />
              </AppButton>
            </div>
            <ListBox
              renderEmptyState={() => <EmptyState>{t('tags.empty')}</EmptyState>}
            >
              {items.map((item) => (
                <ListBox.Item
                  key={item.id}
                  id={item.id}
                  textValue={item.name}
                >
                  {item.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>

      <TagFormModal
        tag={null}
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        onSuccess={handleTagCreated}
      />
    </>
  )
}
