'use client'
import AppLink from '@/components/app/AppLink'
import HighlightedText from '@/components/common/HighlightedText'
import DecksAction from '@/components/decks/DecksAction'
import type { Deck } from '@/modules/decks/decks.schema'
import { formatPercent } from '@/utils/format'
import { Card, Chip } from '@heroui/react'
import clsx from 'clsx'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface DecksCardProps {
  deck: Deck,
  highlight?: string,
}

function DeckStat({ value, label, emphasis = false }: { value: number, label: string, emphasis?: boolean }) {
  const format = useFormatter()
  return (
    <div
      className={clsx(
        'flex flex-col items-center rounded-lg px-2 py-2',
        emphasis && value > 0 ? 'bg-danger/5' : 'bg-default/40',
      )}
    >
      <span
        className={clsx(
          'text-base font-bold tabular-nums',
          value === 0 ? 'text-muted/50' : emphasis ? 'text-danger' : 'text-foreground',
        )}
      >
        {format.number(value, { notation: 'compact' })}
      </span>
      <span className="truncate text-xs text-muted">{label}</span>
    </div>
  )
}

/** My Decks card: a click anywhere starts studying; deck management lives in the menu. */
export default function DecksCard({
  deck,
  highlight = '',
}: DecksCardProps) {
  const router = useRouter()
  const t = useTranslations()
  const { stats } = deck
  const studyHref = `/decks/${deck.id}/study`
  const learned = stats.cards_count - stats.unseen_cards
  const percent = stats.cards_count > 0 ? Math.min(Math.max(learned / stats.cards_count, 0), 1) * 100 : 0

  return (
    <Card
      variant="default"
      className="cursor-pointer gap-3 transition-shadow hover:shadow-md"
      onClick={() => router.push(studyHref)}
    >
      <div className="flex items-center gap-2">
        <AppLink
          onClick={(e) => { e.stopPropagation() }}
          href={studyHref}
          className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-foreground hover:text-accent"
        >
          <HighlightedText text={deck.name} highlight={highlight} />
        </AppLink>
        {deck.visibility === 'public' && (
          <Chip size="sm" variant="primary" color="accent">{t('term.public')}</Chip>
        )}
        {/* Menu clicks (and its delete dialog) must not start studying. */}
        <span onClick={(e) => e.stopPropagation()}>
          <DecksAction deck={deck} actions={['details', 'facts', 'qa', 'edit', 'delete']} />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <DeckStat value={stats.total_reviews ?? 0} label={t('common.total-reviews')} />
        <DeckStat value={stats.due_cards} label={t('term.due')} emphasis />
        <DeckStat value={stats.facts_count} label={t('term.facts')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-default">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted tabular-nums">
          <span>{t('term.progress')}</span>
          <span>{learned}/{stats.cards_count} ({formatPercent(percent)})</span>
        </div>
      </div>
    </Card>
  )
}
