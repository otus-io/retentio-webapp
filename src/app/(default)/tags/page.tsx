import AppError from '@/components/app/AppError'
import { getAllTagsService } from '@/modules/tags/tags.service'
import TagsList from '@/components/tags/TagsList'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export default async function Page() {
  const { data, success, message } = await getAllTagsService()
  if (!success) {
    return <AppError error={message} page />
  }
  return <TagsList data={data.tags} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('term.tags'),
    description: t('common.manage', { name: t('term.tags') }),
  } satisfies Metadata
}
