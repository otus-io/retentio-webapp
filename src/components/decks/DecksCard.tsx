'use client'
import AppLink from '@/components/app/AppLink'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Dropdown, Label, useOverlayState } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Key } from 'react'
import { ChartPie, EllipsisVertical, ListTodo, Pencil, Trash2 } from 'lucide-react'
import DecksIconLabel from '@/components/decks/DecksLabel'
import DecksDeleteModal from '@/components/decks/DecksDeleteModal'
interface DecksCardProps {
  deck: Deck,
}

export default function DecksCard({
  deck,
}: DecksCardProps) {

  const router = useRouter()

  const progress = (deck.stats.reviewed_cards / deck.stats.cards_count * 100).toFixed(2)

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
                {deck.name}
              </AppLink>
            </Card.Title>
            <Dropdown>
              <Dropdown.Trigger>
                <EllipsisVertical className="size-4" />
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu onAction={handleAction}>
                  <Dropdown.Item id="edit" textValue="edit">
                    {/* 建议给下拉菜单也加上极简小图标 */}
                    <div className="flex items-center gap-1">
                      <Pencil className="size-3.5 text-muted-foreground" />
                      <Label>Edit</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="delete" variant="danger">
                    <div className="flex items-center gap-1">
                      <Trash2 className="size-3.5 text-danger" />
                      <Label>Delete</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </Card.Header>

        {/* 内容区域 */}
        <Card.Content>
          <div className="flex items-center gap-6">

            <DecksIconLabel icon={ListTodo} color={'orange'}>
              Due: <span className="font-medium ml-0.5">{deck.stats.due_cards}</span>
            </DecksIconLabel>

            <DecksIconLabel icon={ChartPie} color={'emerald'}>
              Progress: <span className="font-medium  ml-0.5">{progress}%</span>
            </DecksIconLabel>
          </div>
        </Card.Content>
      </Card>

      <DecksDeleteModal {...state} deckId={deck.id} />

    </>
  )
}


