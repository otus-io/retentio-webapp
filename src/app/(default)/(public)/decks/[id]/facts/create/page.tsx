'use server'
import FactsForm from '@/components/facts/FactsForm'
import { getDeckService } from '@/modules/decks/decks.service'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/facts/create'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }

  return (
    <FactsForm deck={data.data} type="create" fact={null} />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
  } satisfies Metadata
}
