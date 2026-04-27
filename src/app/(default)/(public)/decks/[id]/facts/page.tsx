'use server'
import FactsGridPage from '@/components/facts/FactsGridPage'
import { getDeckService } from '@/modules/decks/decks.service'
import { getFactsPageService } from '@/modules/facts/facts.service'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/facts'>) {
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
    <FactsGridPage deck={data.data} facts={page.data.facts} meta={page.meta} />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.decks'),
  } satisfies Metadata
}
