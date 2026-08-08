import DecksDetail from '@/components/decks/DecksDetail'
import { getDeckImportUpdatesService } from '@/modules/deck-sharing/deck-sharing.service'
import { getDeckService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  const updatesResponse = data.data.source_deck_id
    ? await getDeckImportUpdatesService(id)
    : null
  const updates = updatesResponse?.success ? updatesResponse.data : null

  return (
    <DecksDetail deck={data.data} updates={updates} />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
  } satisfies Metadata
}
