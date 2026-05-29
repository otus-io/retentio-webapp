import AppError from '@/components/app/AppError'
import DecksForm from '@/components/decks/DecksForm'
import { getDeckService } from '@/modules/decks/decks.service'
import { getAllTagsService } from '@/modules/tags/tags.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  const { data: result, success, message } = await getAllTagsService()
  if (!success) {
    return <AppError error={message} page />
  }
  return <DecksForm tags={result.tags} type="update" data={data.data} />
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('common.update', { name: t('term.decks') }),
  } satisfies Metadata
}
