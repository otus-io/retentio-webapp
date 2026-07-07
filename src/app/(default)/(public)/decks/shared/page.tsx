import AppErrorPage from '@/components/app/AppErrorPage'
import SharedDecksList from '@/components/decks/SharedDecksList'
import { getDeckCatalogService } from '@/modules/deck-sharing/deck-sharing.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function Page(props:PageProps<'/decks/shared'>) {
  const searchParams = await props.searchParams
  const limit = Number(searchParams.limit) || 10
  const pageNum = Number(searchParams.page) || 1
  const offset = (pageNum - 1) * limit
  const query = searchParams.query || ''

  const deckCatalog = await getDeckCatalogService({
    limit,
    offset,
    query: `${query}`,
  })
  if(!deckCatalog.success){
    return (
      <AppErrorPage
        code={500}
        message={deckCatalog.message}
      />
    )
  }

  return (
    <SharedDecksList
      data={deckCatalog.data.decks}
      totalPages={deckCatalog.meta.limit % deckCatalog.meta.total}
    />
  )
}

export async function generateMetadata() {
  const t = await getTranslations('deck-sharing')
  return {
    title: t('title'),
    description: t('description'),
  } satisfies Metadata
}
