'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Dropdown, Label, useOverlayState } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Key } from 'react'
import { BookA, EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import DecksDeleteModal from '@/components/decks/DecksDeleteModal'
import { useTranslations } from 'next-intl'

interface DecksActionProps {
  deck: Deck,
}


export default function DecksAction({ deck }: DecksActionProps) {
  const t = useTranslations()
  const router = useRouter()
  const state = useOverlayState()

  function handleAction(id: Key) {
    switch (id) {
      case 'edit':
        router.push(`/decks/${deck.id}/edit`)
        break
      case 'facts':
        router.push(`/decks/${deck.id}/facts`)
        break
      case 'delete':
        state.open()
        break
      default:
    }
  }

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
                <Label>{t('decks.facts')}</Label>
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
      <DecksDeleteModal {...state} deckId={deck.id} />
    </>

  )
}
