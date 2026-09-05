import DecksDetail from '@/components/decks/DecksDetail'
import type { ContributionInboxTab } from '@/components/decks/DeckAuthorContributionsPanel'
import { getContributionsService } from '@/modules/contributions/contributions.service'
import { getDeckImportUpdatesService } from '@/modules/deck-sharing/deck-sharing.service'
import { getDeckService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]'>) {
  const id = (await props.params).id
  const searchParams = await props.searchParams
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  const updatesResponse = data.data.source_deck_id
    ? await getDeckImportUpdatesService(id)
    : null
  const updates = updatesResponse?.success ? updatesResponse.data : null
  const requestedStatus = typeof searchParams.contributionStatus === 'string'
    ? searchParams.contributionStatus
    : 'open'
  const selectedTab: ContributionInboxTab = ['all', 'open', 'accepted', 'resolved', 'dismissed'].includes(requestedStatus)
    ? requestedStatus as ContributionInboxTab
    : 'open'
  const isPublicSourceDeck = !data.data.source_deck_id
    && data.data.visibility === 'public'
    && data.data.published_version > 0
  const contributionsResponse = isPublicSourceDeck
    ? await getContributionsService(id, {
      status: selectedTab === 'all' ? undefined : selectedTab,
      limit: 20,
      offset: 0,
    })
    : null
  const authorContributions = contributionsResponse
    ? {
      contributions: contributionsResponse.success ? contributionsResponse.data.contributions : [],
      selectedTab,
      total: contributionsResponse.success ? contributionsResponse.meta.total : 0,
      loadFailed: !contributionsResponse.success,
    }
    : null

  return (
    <DecksDetail
      deck={data.data}
      updates={updates}
      authorContributions={authorContributions}
    />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
  } satisfies Metadata
}
