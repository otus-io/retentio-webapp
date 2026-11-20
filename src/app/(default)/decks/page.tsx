import AppError from '@/components/app/AppError'
import { getDeckSharingStatusesService } from '@/modules/deck-sharing/deck-sharing.service'
import { getAllDecksService } from '@/modules/decks/decks.service'
import DecksList from '@/components/decks/DecksList'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export default async function Page() {
  const { data, success, message } = await getAllDecksService()
  if(!success){
    return <AppError error={message} page />
  }
  const decks = data?.decks || []
  return <DecksList data={decks} sharing={await getDeckSharingStatusesService(decks)} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
    description: t('common.manage', { name: t('term.decks') }),
  } satisfies Metadata
}
