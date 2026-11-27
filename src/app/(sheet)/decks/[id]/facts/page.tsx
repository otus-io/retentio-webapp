'use server'
import FactsGridPage from '@/components/facts/FactsGridPage'
import { FACTS_FIRST_PAGE_SIZE, FACTS_SORT } from '@/components/facts/factsSheet'
import { getDeckService } from '@/modules/decks/decks.service'
import { getFactsPageService } from '@/modules/facts/facts.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/facts'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  const page = await getFactsPageService(id, { limit: FACTS_FIRST_PAGE_SIZE, offset: 0, sort: FACTS_SORT })
  if(!page.success){
    notFound()
  }

  return (
    // A column added or removed elsewhere starts the sheet afresh; renames update it in place.
    <FactsGridPage key={`${id}:${data.data.fields.length}`} deck={data.data} facts={page.data.facts} total={page.meta.total} />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
  } satisfies Metadata
}
