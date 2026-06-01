'use client'
import AppLink from '@/components/app/AppLink'
import type { Deck } from '@/modules/decks/decks.schema'
import { Card } from '@heroui/react'
import { ListTodo, Clock } from 'lucide-react'
import HighlightedText from '@/components/common/HighlightedText'
import { useTranslations } from 'next-intl'
import DecksAction from '@/components/decks/DecksAction'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

interface DecksCardProps {
  deck: Deck,
  highlight?: string,
}

export default function DecksCard({
  deck,
  highlight = '',
}: DecksCardProps) {
  const router = useRouter()
  const t = useTranslations()

  const progressPct = deck.stats.cards_count > 0
    ? (deck.stats.reviewed_cards / deck.stats.cards_count) * 100
    : 0

  const lastReviewedAt = useMemo(() => {
    if (deck.stats.last_reviewed_at) {
      return new Date(deck.stats.last_reviewed_at * 1000).toLocaleDateString()
    }
    return t('term.never')
  }, [deck.stats.last_reviewed_at, t])

  const handleClick = useCallback(() => {
    router.push(`/decks/${deck.id}`)
  }, [deck.id, router])

  return (
    <Card
      variant="default"
      className="hover:shadow-sm transition-all hover:cursor-pointer duration-200 border-border/60 hover:border-accent/30 border-l-2 border-l-accent/50 hover:border-l-accent overflow-hidden"
      onClick={handleClick}
    >

      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <Card.Title className="flex-1 min-w-0">
            <AppLink
              onClick={(e) => { e.stopPropagation() }}
              href={`/decks/${deck.id}`}
              className="text-base font-semibold tracking-tight text-foreground hover:text-accent transition-colors line-clamp-1"
            >
              <HighlightedText text={deck.name} highlight={highlight} />
            </AppLink>
          </Card.Title>
          <DecksAction deck={deck} actions={['edit', 'delete']} />
        </div>
      </Card.Header>

      <Card.Content className="pt-0 space-y-2.5">
        <div>
          <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground tabular-nums">
            <span>{progressPct.toFixed(1)}%</span>
            <span>{deck.stats.reviewed_cards} / {deck.stats.cards_count}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ListTodo className="size-3 text-rose-500 shrink-0" />
            <span>{t('term.due')}:</span>
            <span className="font-semibold text-foreground">{deck.stats.due_cards}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-slate-400 shrink-0" />
            <span>{t('term.last-review')}:</span>
            <span>{lastReviewedAt}</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}


