'use client'
import type { Deck } from '@/modules/decks/decks.schema'
import { Dropdown, Label } from '@heroui/react'
import { useRouter } from 'next/navigation'
import type { Key } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { BookA, EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import DeleteModal from '@/components/common/DeleteModal'
import { deleteDeckAction } from '@/modules/decks/decks.action'

interface DecksActionProps {
  deck: Deck,
}

export default function DecksAction({ deck }: DecksActionProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const deleteDeck = useMemo(() => deleteDeckAction.bind(null, deck.id), [deck.id])

  const handleAction = useCallback((id: Key) => {
    switch (id) {
      case 'edit':
        router.push(`/decks/${deck.id}/edit`)
        break
      case 'facts':
        router.push(`/decks/${deck.id}/facts`)
        break
      case 'delete':
        setIsOpen(true)
        break
      default:
    }
  }, [deck.id, router])

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger>
          <EllipsisVertical className="size-4 text-muted" />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            <Dropdown.Item id="edit" textValue="edit">
              <div className="flex items-center gap-1">
                <Pencil className="size-3.5 text-muted-foreground" />
                <Label>{t('common.edit')}</Label>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="facts" textValue="facts" variant="default">
              <div className="flex items-center gap-1">
                <BookA className="size-3.5 text-muted-foreground" />
                <Label>{t('term.facts')}</Label>
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
      <DeleteModal isOpen={isOpen} setIsOpen={setIsOpen} action={deleteDeck} />
    </>
  )
}
