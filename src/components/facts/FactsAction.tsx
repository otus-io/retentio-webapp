'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Dropdown, Label } from '@heroui/react'
import { useParams, useRouter } from 'next/navigation'
import { Key, useCallback, useMemo, useState } from 'react'
import { EllipsisVertical, EyeIcon, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import DeleteModal from '@/components/common/DeleteModal'
import { Fact } from '@/modules/facts/facts.schema'
import { deleteFactAction } from '@/modules/facts/facts.action'

interface DecksActionProps {
  deck: Deck,
  fact: Fact,
}

export default function FactsAction({ deck, fact }: DecksActionProps) {
  const t = useTranslations()
  const router = useRouter()
  const deleteDeck = useMemo(()=>{
    return deleteFactAction.bind(null, { deckId: deck.id, factId: fact.id })
  }, [deck.id, fact.id])
  const [isOpen, setIsOpen] = useState(false)

  const params = useParams()

  const handleAction = useCallback((id: Key)=> {
    switch (id) {
      case 'detail':
        router.push(`/decks/${deck.id}/facts/${fact.id}`)
        break
      case 'edit':
        router.push(`/decks/${deck.id}/facts/${fact.id}/edit`)
        break
      case 'delete':
        setIsOpen(true)
        break
      default:
    }
  }, [deck.id, fact.id, router, setIsOpen])

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger>
          <EllipsisVertical className="size-4 text-muted" />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            {
              !params && (
                <Dropdown.Item id="detail" textValue="detail">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="size-3.5" />
                    <Label>{t('common.detail')}</Label>
                  </div>
                </Dropdown.Item>
              )
            }
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
      <DeleteModal isOpen={isOpen} setIsOpen={setIsOpen} action={deleteDeck} />
    </>

  )
}
