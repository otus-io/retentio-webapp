'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip, Separator, useOverlayState } from '@heroui/react'
import { useMemo } from 'react'
import DecksIconLabel from '@/components/decks/DecksLabel'
import DecksDeleteModal from '@/components/decks/DecksDeleteModal'
interface DecksDetailProps {
  deck: Deck,
}
import {
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
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import AppButton from '@/components/app/AppButton'
import { AppButtonLink } from '@/components/app/AppButtonLink'

export default function DecksDetail({
  deck,
}: DecksDetailProps) {
  const state = useOverlayState()
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


  return (
    <>
      <Card variant="default" className="hover:shadow-md transition-all duration-300 border-border/50 min-h-0 ">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
              {deck.name}
            </Card.Title>

          </div>
        </Card.Header>

        {/* 内容区域 */}
        <Card.Content className="space-y-2">
          <div className="flex flex-col gap-2">
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
          </div>

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
          <Separator className="bg-border/60" />

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
        </Card.Content>
        <Card.Footer className="flex justify-end">
          <AppButtonLink variant="ghost" isIconOnly href={`/decks/${deck.id}/edit`}>
            <Pencil className="size-3.5  text-muted" />
          </AppButtonLink>
          <AppButton variant="ghost" isIconOnly onClick={state.open}>
            <Trash2 className="size-3.5 text-muted" />
          </AppButton>
        </Card.Footer>
      </Card>
      <DecksDeleteModal {...state} deckId={deck.id} />
    </>
  )
}
