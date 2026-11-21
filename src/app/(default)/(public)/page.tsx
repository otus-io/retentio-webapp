import SharedDecksHome from '@/components/decks/SharedDecksHome'
import HomePage from '@/components/home/HomePage'
import { getDeckCatalogService } from '@/modules/deck-sharing/deck-sharing.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

/** 首页每页展示的公开卡组数 */
const HOME_PAGE_SIZE = 6
/** The page waits at most this long for the catalog, so a slow backend never blocks the landing content. */
const CATALOG_WAIT_MS = 3000

async function SharedDecksHomeSCP({ page }: { page: number }){
  const homeDecks = await Promise.race([
    getDeckCatalogService({ limit: HOME_PAGE_SIZE, offset: (page - 1) * HOME_PAGE_SIZE }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), CATALOG_WAIT_MS)),
  ])
  if(!homeDecks?.success){
    return null
  }
  const totalPages = Math.ceil((homeDecks.meta.total ?? 0) / HOME_PAGE_SIZE)
  if (totalPages > 0 && page > totalPages) redirect(`/?page=${totalPages}`)
  return <SharedDecksHome data={homeDecks.data.decks} totalPages={totalPages} />
}

export default async function Page(props: PageProps<'/'>) {
  const requested = Number((await props.searchParams).page)
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1
  // Rendered with the page rather than streamed in a Suspense boundary: the page now depends on `?page=`, and a
  // streamed boundary briefly showed the catalog twice while hydrating.
  return (
    <HomePage>
      <SharedDecksHomeSCP page={page} />
    </HomePage>
  )
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.home'),
  } satisfies Metadata
}

