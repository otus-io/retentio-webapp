'use client'
import type { Deck } from '@/modules/decks/decks.schema'
import { Dropdown, Label } from '@heroui/react'
import type { Key } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import DeleteModal from '@/components/common/DeleteModal'
import type { Fact } from '@/modules/facts/facts.schema'
import { deleteFactAction } from '@/modules/facts/facts.action'

interface DecksActionProps {
  deck: Deck,
  fact: Fact,
}

export default function FactsAction({ deck, fact }: DecksActionProps) {
  const t = useTranslations()
  const deleteDeck = useMemo(() => {
    return deleteFactAction.bind(null, { deckId: deck.id, factId: fact.id })
  }, [deck.id, fact.id])
  const [isOpen, setIsOpen] = useState(false)


  const handleAction = useCallback((id: Key) => {
    switch (id) {
      case 'delete':
        setIsOpen(true)
        break
      default:
    }
  }, [setIsOpen])

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger>
          <EllipsisVertical className="size-4 text-muted" />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
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
