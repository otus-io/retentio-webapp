import StudySession from '@/components/study/StudySession'
import { getStudyTagsService } from '@/modules/cards/cards.service'
import { getDeckService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/study'>) {
  const id = (await props.params).id
  const [data, tags] = await Promise.all([getDeckService(id), getStudyTagsService(id)])
  if (!data.success) {
    notFound()
  }
  // The filter is optional; without tags the session still studies every card.
  return <StudySession deck={data.data} tags={tags.success ? tags.data.tags ?? [] : []} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('study.title'),
  } satisfies Metadata
}
