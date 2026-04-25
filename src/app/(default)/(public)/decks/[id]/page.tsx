'use server'
import DecksDetail from '@/components/decks/DecksDetail'
import FactsPageList from '@/components/facts/FactsPageList'
import { getDeckService } from '@/modules/decks/decks.service'
import { getFactsPageService } from '@/modules/facts/facts.service'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  const searchParams = await props.searchParams
  const limit = Number(searchParams.limit) || 10
  const pageNum = Number(searchParams.page) || 1
  const offset = (pageNum - 1) * limit
  const page = await getFactsPageService(id, { limit, offset })
  if(!page.success){
    notFound()
  }

  return (
    <div className="mx-auto max-w-content py-4 gap-2 grid md:grid-cols-[auto_1fr] px-3.5 items-start">
      <DecksDetail deck={data.data} />
      <FactsPageList
        facts={page.data.facts}
        meta={page.meta}
        deckId={id}
        createHref={`/decks/${id}/facts/create`}
      />
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.decks'),
  } satisfies Metadata
}
