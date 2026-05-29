import AppError from '@/components/app/AppError'
import DecksForm from '@/components/decks/DecksForm'
import { getAllTagsService } from '@/modules/tags/tags.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const { data, success, message } = await getAllTagsService()
  if (!success) {
    return <AppError error={message} page />
  }
  return <DecksForm tags={data.tags} type="create" data={null} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('common.create', { name: t('term.decks') }),
  } satisfies Metadata
}
