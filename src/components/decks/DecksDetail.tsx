'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip, Disclosure, Dropdown, Label, Separator, useOverlayState } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Key, useState } from 'react'
import DecksIconLabel from '@/components/decks/DecksLabel'
import DecksDeleteModal from '@/components/decks/DecksDeleteModal'
interface DecksDetailProps {
  deck: Deck,
}
import {
  EllipsisVertical,
  ListTodo,
  ChartPie,
  Pencil,
  Trash2,
  History,
  Layers,
  Brain,
  Inbox,
  CheckCircle2,
  EyeOff,
  Sparkles,
  Clock,
  Type,
  ChevronUp,
} from 'lucide-react'
import clsx from 'clsx'
// 请确保导入了你的其他 UI 组件 (Card, Dropdown, Label, Chip, Separator 等)

export default function DecksDetail({
  deck,
}: DecksDetailProps) {
  const router = useRouter()
  const state = useOverlayState()

  // 避免分母为 0 的 NaN 情况
  const progress = deck.stats.cards_count > 0
    ? ((deck.stats.reviewed_cards / deck.stats.cards_count) * 100).toFixed(2)
    : '0.00'
  const [isExpanded, setIsExpanded] = useState(true)
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
      <Card variant="default" className="hover:shadow-md transition-all duration-300 border-border/50">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
              {deck.name}
            </Card.Title>
            <Dropdown>
              <Dropdown.Trigger>
                <EllipsisVertical className="size-4" />
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu onAction={handleAction}>
                  <Dropdown.Item id="edit" textValue="edit">
                    <div className="flex items-center gap-2">
                      <Pencil className="size-3.5 text-muted-foreground" />
                      <Label>Edit</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="delete" variant="danger">
                    <div className="flex items-center text-danger gap-2">
                      <Trash2 className="size-3.5" />
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


          {/* 顶层核心数据：Fields, Rate, Due, Progress */}
          <div className="flex flex-col gap-2">
            {/* Fields 区域：加了 flex-wrap 防止标签过多溢出 */}
            <DecksIconLabel icon={Type}>
              <span className="text-muted-foreground mr-1">Fields:</span>
              <div className=" flex-wrap items-center gap-1.5 inline-flex">
                {deck.fields.map((e, index) => (
                  <Chip className="font-medium bg-secondary/50" key={index} size="sm">
                    {e}
                  </Chip>
                ))}
              </div>
            </DecksIconLabel>

            {/* 核心指标 */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <DecksIconLabel icon={History}>
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium text-foreground ml-1">{deck.rate}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ListTodo}>
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.due_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ChartPie}>
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium text-foreground ml-1">{progress}%</span>
              </DecksIconLabel>
            </div>
          </div>

          <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
            <Disclosure.Content>
              <Disclosure.Body className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <Separator className="bg-border/60" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <DecksIconLabel icon={Brain}>
                      <span className="text-muted-foreground">Facts:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.facts_count}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Layers}>
                      <span className="text-muted-foreground">Cards:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.cards_count}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Inbox}>
                      <span className="text-muted-foreground">Unseen:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.unseen_cards}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={CheckCircle2}>
                      <span className="text-muted-foreground">Reviewed:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.reviewed_cards}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={EyeOff}>
                      <span className="text-muted-foreground">Hidden:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.hidden_cards}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Sparkles}>
                      <span className="text-muted-foreground">New today:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.new_cards_today}</span>
                    </DecksIconLabel>


                    <DecksIconLabel icon={Clock}>
                      <span className="text-muted-foreground">Last review:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.last_reviewed_at || 'Never'}</span>
                    </DecksIconLabel>
                  </div>
                </div>
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
          <button className="text-muted flex hover:cursor-pointer items-center" type="button" onClick={()=>setIsExpanded((val)=>!val)}>
            <Separator className="flex-1" />
            <ChevronUp className={clsx('transition-all size-4', isExpanded && 'rotate-180')} />
            <Separator className="flex-1" />
          </button>
        </Card.Content>
      </Card>

      <DecksDeleteModal {...state} deckId={deck.id} />
    </>
  )
}
