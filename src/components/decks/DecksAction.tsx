'use client'
import type { Deck } from '@/modules/decks/decks.schema'
import { Dropdown, Label } from '@heroui/react'
import { useRouter } from 'next/navigation'
import type { Key } from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  BookA, EllipsisVertical, Inbox, Info, Pencil, Plus, RefreshCw, Send, Share2, ShieldCheck, Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import DeleteModal from '@/components/common/DeleteModal'
import { deleteDeckAction } from '@/modules/decks/decks.action'
import type { DeckSheetKind } from '@/components/decks/DeckSharingSheet'

export type DecksActionItem = 'details' | 'edit' | 'facts' | 'qa' | 'delete' | DeckSheetKind

const sheetItems = [
  { id: 'add-fact', label: 'deck-menu.add-fact', Icon: Plus },
  { id: 'publish', label: 'deck-menu.publish-deck', Icon: Share2 },
  { id: 'inbox', label: 'deck-menu.contributions-inbox', Icon: Inbox },
  { id: 'outbox', label: 'deck-menu.pending-outbox', Icon: Send },
  { id: 'updates', label: 'deck-menu.check-updates', Icon: RefreshCw },
] as const

interface DecksActionProps {
  deck: Deck,
  actions: DecksActionItem[]
  /** Opens a sharing sheet (publish, inbox, outbox, updates) */
  onOpenSheet?: (kind: DeckSheetKind) => void
}



export default function DecksAction({ deck, actions, onOpenSheet }: DecksActionProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const deleteDeck = useMemo(() => deleteDeckAction.bind(null, deck.id), [deck.id])

  const handleAction = useCallback((id: Key) => {
    switch (id) {
      case 'details':
        router.push(`/decks/${deck.id}`)
        break
      case 'edit':
        router.push(`/decks/${deck.id}/edit`)
        break
      case 'facts':
        router.push(`/decks/${deck.id}/facts`)
        break
      case 'qa':
        router.push(`/decks/${deck.id}/qa`)
        break
      case 'delete':
        setIsOpen(true)
        break
      case 'add-fact':
      case 'publish':
      case 'inbox':
      case 'outbox':
      case 'updates':
        onOpenSheet?.(id)
        break
      default:
    }
  }, [deck.id, router, onOpenSheet])

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger aria-label={t('common.deck-options')}>
          <EllipsisVertical className="size-4 text-muted" />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            {actions.includes('details') && (
              <Dropdown.Item id="details" textValue="details">
                <div className="flex items-center gap-1">
                  <Info className="size-3.5 text-muted-foreground" />
                  <Label>{t('common.deck-details')}</Label>
                </div>
              </Dropdown.Item>
            )}
            {actions.includes('edit') && (
              <Dropdown.Item id="edit" textValue="edit">
                <div className="flex items-center gap-1">
                  <Pencil className="size-3.5 text-muted-foreground" />
                  <Label>{t('common.edit-deck')}</Label>
                </div>
              </Dropdown.Item>
            )
            }
            {
              actions.includes('facts') && (
                <Dropdown.Item id="facts" textValue="facts" variant="default">
                  <div className="flex items-center gap-1">
                    <BookA className="size-3.5 text-muted-foreground" />
                    <Label>{t('common.edit-facts')}</Label>
                  </div>
                </Dropdown.Item>
              )
            }
            {sheetItems.filter((item) => actions.includes(item.id)).map(({ id, label, Icon }) => (
              <Dropdown.Item key={id} id={id} textValue={id}>
                <div className="flex items-center gap-1">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <Label>{t(label)}</Label>
                </div>
              </Dropdown.Item>
            ))}
            {
              actions.includes('qa') && (
                <Dropdown.Item id="qa" textValue="qa" variant="default">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <Label>{t('qa.title')}</Label>
                  </div>
                </Dropdown.Item>
              )
            }
            {
              actions.includes('delete') && (
                <Dropdown.Item
                  id="delete"
                  textValue="delete"
                  variant="danger"
                  isDisabled={deck.visibility === 'public'}
                >
                  <div className="flex items-center gap-1">
                    <Trash2 className="size-3.5 text-danger" />
                    <Label>{t('common.delete')}</Label>
                  </div>
                </Dropdown.Item>
              )
            }
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <DeleteModal isOpen={isOpen} setIsOpen={setIsOpen} action={deleteDeck} />
    </>
  )
}
