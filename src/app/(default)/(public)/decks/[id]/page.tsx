'use server'
import DecksDetail from '@/components/decks/DecksDetail'
import { getDeckService } from '@/modules/decks/decks.service'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  return (
    <div className="mx-auto max-w-content py-4 grid grid-cols-[auto_1fr] px-3.5">
      <DecksDetail deck={data.data} />
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.decks'),
  } satisfies Metadata
}
