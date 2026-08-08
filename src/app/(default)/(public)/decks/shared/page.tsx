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
  const totalPages = deckCatalog.meta.total ? Math.ceil(deckCatalog.meta.total / deckCatalog.meta.limit) : 0

  return (
    <SharedDecksList
      data={deckCatalog.data.decks}
      totalPages={totalPages}
    />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.deck-sharing'),
    description: t('deck-sharing.description'),
  } satisfies Metadata
}
