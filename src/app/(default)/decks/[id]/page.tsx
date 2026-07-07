'use server'
import DecksDetail from '@/components/decks/DecksDetail'
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
  return (
    <DecksDetail deck={data.data} />
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.decks'),
  } satisfies Metadata
}
