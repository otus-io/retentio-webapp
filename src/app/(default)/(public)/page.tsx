import SharedDecksHome from '@/components/decks/SharedDecksHome'
import HomePage from '@/components/home/HomePage'
import { getDeckCatalogService } from '@/modules/deck-sharing/deck-sharing.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

async function SharedDecksHomeSCP(){
  // 首页只推荐 6 个
  const homeDecks = await getDeckCatalogService({ limit: 6, offset: 0 })
  if(!homeDecks.success){
    return null
  }
  return <SharedDecksHome data={homeDecks.data.decks} />
}

export default async function Page() {
  return (
    <HomePage>
      <Suspense>
        <SharedDecksHomeSCP />
      </Suspense>
    </HomePage>
  )
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.home'),
  } satisfies Metadata
}

