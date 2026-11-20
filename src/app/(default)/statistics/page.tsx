import AppError from '@/components/app/AppError'
import StatisticsPanel from '@/components/statistics/StatisticsPanel'
import { getReviewsByDayService } from '@/modules/cards/cards.service'
import { REVIEW_RANGES, summarizeReviewDays } from '@/modules/cards/cards.schema'
import { getAllDecksService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function Page(props: PageProps<'/statistics'>) {
  const searchParams = await props.searchParams
  const decksResponse = await getAllDecksService()
  if (!decksResponse.success) {
    return <AppError error={decksResponse.message} page />
  }
  const decks = decksResponse.data.decks ?? []
  const requestedDays = Number(searchParams.days)
  const days = (REVIEW_RANGES as readonly number[]).includes(requestedDays) ? requestedDays : 30
  const deckId = typeof searchParams.deck === 'string' && decks.some((d) => d.id === searchParams.deck)
    ? searchParams.deck
    : null
  const targets = deckId ? [deckId] : decks.map((d) => d.id)
  const responses = await Promise.all(targets.map((id) => getReviewsByDayService(id, days)))
  const loaded = responses.flatMap((r) => r.success ? [r.data.days] : [])
  const loadFailed = targets.length > 0 && loaded.length === 0

  return (
    <StatisticsPanel
      decks={decks.map((d) => ({ id: d.id, name: d.name }))}
      deckId={deckId}
      days={days}
      summary={loadFailed ? null : summarizeReviewDays(loaded)}
      partial={!loadFailed && loaded.length < targets.length}
    />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('statistics.title'),
  } satisfies Metadata
}
