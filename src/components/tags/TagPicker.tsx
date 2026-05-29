'use client'
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
  Tag as Tag,
  TagGroup,
  useFilter,
} from '@heroui/react'
import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'


interface TagPickerProps {
  tags: ITag[]
}

export default function TagSelect({
  tags,
}:TagPickerProps) {
  const [items] = useState(tags)
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

  return (
    <>
      <Autocomplete
        placeholder="Select Tags"
        selectionMode="multiple"
        value={selectedKeys}
        variant="secondary"
        onChange={(keys) => setSelectedKeys(keys as Key[])}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Label>Tags</Label>
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
                  <SearchField.Input placeholder="Search users..." />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              <AppButton isIconOnly onClick={() => handleCreateTag()}>
                <Plus />
              </AppButton>
            </div>
            <ListBox
              renderEmptyState={() => <EmptyState>No results found</EmptyState>}
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

      <TagFormModal tag={null} isOpen={modalOpen} setIsOpen={setModalOpen} />
    </>
  )
}
