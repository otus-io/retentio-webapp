import DecksForm from '@/components/decks/DecksForm'
import { getDeckService, getDeckTagsService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const tags = await getDeckTagsService(id)
  if(!tags.success){
    notFound()
  }
  const deck = await getDeckService(id)
  if(!deck.success){
    notFound()
  }
  return (
    <DecksForm
      type="update"
      data={{
        ...deck.data,
        tagIds: (tags.data.tags ?? []).map((e) => e.id),
      }}
    />
  )
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('common.update', { name: t('term.decks') }),
  } satisfies Metadata
}
