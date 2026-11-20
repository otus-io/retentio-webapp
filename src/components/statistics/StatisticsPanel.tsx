'use client'

import AppError from '@/components/app/AppError'
import AppSelect from '@/components/app/AppSelect'
import LayoutPage from '@/components/layout/LayoutPage'
import { REVIEW_RANGES, type ReviewSummary, reviewDayToDate } from '@/modules/cards/cards.schema'
import { Card, Tooltip } from '@heroui/react'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const ALL_DECKS = '__all__'

interface StatisticsPanelProps {
  decks: { id: string, name: string }[]
  deckId: string | null
  days: number
  summary: ReviewSummary | null
}

export default function StatisticsPanel({ decks, deckId, days, summary }: StatisticsPanelProps) {
  const t = useTranslations('statistics')
  const format = useFormatter()
  const router = useRouter()

  const navigate = (next: { deck?: string | null, days?: number }) => {
    const params = new URLSearchParams()
    const deck = next.deck === undefined ? deckId : next.deck
    if (deck) params.set('deck', deck)
    params.set('days', String(next.days ?? days))
    router.push(`/statistics?${params}`)
  }

  const formatDay = (day: string) => format.dateTime(reviewDayToDate(day), {
    dateStyle: 'medium',
    timeZone: 'UTC',
  })

  const weekdayLabel = (index: number) => format.dateTime(new Date(Date.UTC(2024, 0, 7 + index)), {
    weekday: 'short',
    timeZone: 'UTC',
  })

  const maxDay = Math.max(1, ...(summary?.days.map((d) => d.count) ?? []))
  const maxWeekday = Math.max(1, ...(summary?.weekdays ?? []))

  return (
    <LayoutPage breadcrumbs={[{ href: '/statistics', title: t('title') }]}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <AppSelect
            label={t('deck-filter')}
            items={[{ id: ALL_DECKS, name: t('all-decks') }, ...decks]}
            value={deckId ?? ALL_DECKS}
            onChange={(key) => navigate({ deck: key && key !== ALL_DECKS ? String(key) : null })}
          />
          <AppSelect
            className="w-40"
            label={t('range')}
            items={REVIEW_RANGES.map((d) => ({ id: String(d), name: t('range-days', { count: d }) }))}
            value={String(days)}
            onChange={(key) => navigate({ days: Number(key) })}
          />
        </div>

        {decks.length === 0 && <p className="text-muted">{t('no-decks')}</p>}
        {decks.length > 0 && !summary && <AppError error={t('load-failed')} />}

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {([
                ['period-reviews', summary.total],
                ['today-reviews', summary.today],
                ['active-days', summary.activeDays],
                ['daily-average', summary.average],
              ] as const).map(([key, value]) => (
                <Card key={key} className="gap-1 p-4">
                  <span className="text-xs text-muted">{t(key)}</span>
                  <span className="text-2xl font-semibold tabular-nums">{format.number(value)}</span>
                </Card>
              ))}
            </div>

            <Card className="gap-3 p-4">
              <Card.Title>{t('daily-activity')}</Card.Title>
              {summary.total === 0
                ? <p className="py-8 text-center text-sm text-muted">{t('no-activity')}</p>
                : (
                  <div className="flex h-40 items-end gap-px" role="img" aria-label={t('daily-activity')}>
                    {summary.days.map((d) => (
                      <Tooltip key={d.day} delay={0}>
                        <Tooltip.Trigger className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-sm bg-accent"
                            style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 2 : 0 }}
                          />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          {formatDay(d.day)}: {t('reviews-count', { count: d.count })}
                        </Tooltip.Content>
                      </Tooltip>
                    ))}
                  </div>
                )}
            </Card>

            <Card className="gap-3 p-4">
              <Card.Title>{t('weekday-distribution')}</Card.Title>
              <div className="flex flex-col gap-2">
                {summary.weekdays.map((count, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="w-10 text-muted">{weekdayLabel(index)}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-border/50">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(count / maxWeekday) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right tabular-nums">{format.number(count)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <p className="text-xs text-muted">{t('utc-note')}</p>
          </>
        )}
      </div>
    </LayoutPage>
  )
}
