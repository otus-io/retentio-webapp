'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip, Disclosure, Dropdown, Label, Separator, useOverlayState } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Key, useMemo, useState } from 'react'
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
import { useTranslations } from 'next-intl'

export default function DecksDetail({
  deck,
}: DecksDetailProps) {
  const router = useRouter()
  const state = useOverlayState()
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations()

  const progress = deck.stats.cards_count > 0
    ? ((deck.stats.reviewed_cards / deck.stats.cards_count) * 100).toFixed(2)
    : '0.00'


  const last_reviewed_at = useMemo(()=>{
    if(deck.stats.last_reviewed_at){
      const date = new Date(deck.stats.last_reviewed_at*1000)
      return date.toLocaleString()
    }
    return 'never'
  }, [deck.stats.last_reviewed_at])


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
                      <Label>{t('common.edit')}</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="delete" variant="danger">
                    <div className="flex items-center text-danger gap-2">
                      <Trash2 className="size-3.5" />
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


          {/* 顶层核心数据：Fields, Rate, Due, Progress */}
          <div className="flex flex-col gap-2">
            {/* Fields 区域：加了 flex-wrap 防止标签过多溢出 */}
            <DecksIconLabel icon={Type}>
              <span className="text-muted-foreground mr-1">{t('decks.fields')}:</span>
              <div className=" flex-wrap items-center gap-1.5 inline-flex">
                {deck.fields.map((e, index) => (
                  <Chip className="font-medium bg-secondary/50" key={index} size="sm">
                    {e}
                  </Chip>
                ))}
              </div>
            </DecksIconLabel>

            {/* 核心指标 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <DecksIconLabel icon={History}>
                <span className="text-muted-foreground">{t('decks.rate')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.rate}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ListTodo}>
                <span className="text-muted-foreground">{t('decks.due')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.due_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ChartPie}>
                <span className="text-muted-foreground">{t('decks.progress')}:</span>
                <span className="font-medium text-foreground ml-1">{progress}%</span>
              </DecksIconLabel>
            </div>
          </div>

          <Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
            <Disclosure.Content>
              <Disclosure.Body className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <Separator className="bg-border/60 mb-3" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <DecksIconLabel icon={Brain}>
                      <span className="text-muted-foreground">{t('decks.facts')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.facts_count}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Layers}>
                      <span className="text-muted-foreground">{t('decks.cards')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.cards_count}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Inbox}>
                      <span className="text-muted-foreground">{t('decks.unseen')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.unseen_cards}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={CheckCircle2}>
                      <span className="text-muted-foreground">{t('decks.reviewed')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.reviewed_cards}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={EyeOff}>
                      <span className="text-muted-foreground">{t('decks.hidden')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.hidden_cards}</span>
                    </DecksIconLabel>


                    <DecksIconLabel icon={Sparkles}>
                      <span className="text-muted-foreground">{t('decks.new-today')}:</span>
                      <span className="font-medium text-foreground ml-1">{deck.stats.new_cards_today}</span>
                    </DecksIconLabel>

                    <DecksIconLabel icon={Clock} className="col-span-2">
                      <span className="text-muted-foreground">{t('decks.last-review')}:</span>
                      <span className="font-medium text-foreground ml-1">{last_reviewed_at}</span>
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
