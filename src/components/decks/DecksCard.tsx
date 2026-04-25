'use client'
import AppLink from '@/components/app/AppLink'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Dropdown, Label, useOverlayState } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Key } from 'react'
import { ChartPie, EllipsisVertical, ListTodo, Pencil, Trash2 } from 'lucide-react'
import DecksIconLabel from '@/components/decks/DecksLabel'
import DecksDeleteModal from '@/components/decks/DecksDeleteModal'
import HighlightedText from '@/components/common/HighlightedText'
import { useTranslations } from 'next-intl'

interface DecksCardProps {
  deck: Deck,
  highlight?: string,
}

export default function DecksCard({
  deck,
  highlight = '',
}: DecksCardProps) {

  const t = useTranslations()
  const router = useRouter()
  const progress = deck.stats.cards_count > 0
    ? ((deck.stats.reviewed_cards / deck.stats.cards_count) * 100).toFixed(2)
    : '0.00'


  const state = useOverlayState()
  function handleAction(id: Key) {
    switch (id) {
      case 'edit':
        router.push(`/decks/${deck.id}/edit`)
        break
      case 'delete':
        state.open()
        break
      default:
    }
  }
  return (
    <>
      <Card variant="default" className="hover:shadow-sm transition-all duration-200">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>
              <AppLink
                href={`/decks/${deck.id}`}
                className="text-lg font-semibold tracking-tight text-foreground hover:text-accent hover:underline transition-colors"
              >
                <HighlightedText
                  text={deck.name}
                  highlight={highlight}
                />
              </AppLink>
            </Card.Title>
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
                  <Dropdown.Item id="delete" textValue="delete" variant="danger">
                    <div className="flex items-center gap-1">
                      <Trash2 className="size-3.5 text-danger" />
                      <Label>{t('common.delete')}</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </Card.Header>

        {/* 内容区域 */}
        <Card.Content>
          <div className="flex items-center gap-2">
            <DecksIconLabel icon={ListTodo} color={'orange'}>
              {t('decks.due')}: <span className="font-medium ml-0.5">{deck.stats.due_cards}</span>
            </DecksIconLabel>
            <DecksIconLabel icon={ChartPie} color={'emerald'}>
              {t('decks.progress')}: <span className="font-medium  ml-0.5">{progress}%</span>
            </DecksIconLabel>
          </div>
        </Card.Content>
      </Card>
      <DecksDeleteModal {...state} deckId={deck.id} />
    </>
  )
}


