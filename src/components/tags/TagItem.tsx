'use client'

import type { Tag } from '@/modules/tags/tags.schema'
import { Chip, Dropdown, Label } from '@heroui/react'
import type { Key } from 'react'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import AppTooltip from '@/components/app/AppTooltip'
import HighlightedText from '@/components/common/HighlightedText'
import DeleteModal from '@/components/common/DeleteModal'
import { deleteTagAction } from '@/modules/tags/tags.action'

interface TagItemProps {
  tag: Tag
  highlight?: string
  onEdit?: (tag: Tag) => void
  editable?: boolean
}

export default function TagItem({ tag, highlight, onEdit, editable = true }: TagItemProps) {
  const t = useTranslations()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [, startTransition] = useTransition()

  const boundDeleteAction = useMemo(() => deleteTagAction.bind(null, tag.id), [tag.id])

  const handleDeleteSuccess = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router])

  const handleAction = useCallback((key: Key) => {
    if (key === 'edit') onEdit?.(tag)
    if (key === 'delete') setDeleteOpen(true)
  }, [tag, onEdit])

  const chip = (
    <Chip
      data-tag-name={tag.name}
      style={{
        '--radius': '.5rem',
      }}
      variant="secondary"
    >
      <Chip.Label className="font-medium text-foreground">
        <HighlightedText text={tag.name} highlight={highlight ?? ''} />
      </Chip.Label>

      {
        editable && (
          <>
            <Dropdown>
              <Dropdown.Trigger
                className="ml-0.5 rounded-full p-0.5 text-muted hover:text-foreground transition-colors"
                aria-label={t('common.actions')}
              >
                <EllipsisVertical className="size-3" />
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu onAction={handleAction}>
                  <Dropdown.Item id="edit" textValue="edit">
                    <div className="flex items-center gap-1">
                      <Pencil className="size-3.5 text-muted-foreground" />
                      <Label>{t('common.edit')}</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="delete" variant="danger">
                    <div className="flex items-center gap-1">
                      <Trash2 className="size-3.5 text-danger" />
                      <Label>{t('common.delete')}</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </>
        )
      }

    </Chip>
  )

  return (
    <>
      {tag.description
        ? (
          <AppTooltip content={<p>{tag.description}</p>}>
            {chip}
          </AppTooltip>
        )
        : chip}
      <DeleteModal
        isOpen={deleteOpen}
        setIsOpen={setDeleteOpen}
        action={boundDeleteAction}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
