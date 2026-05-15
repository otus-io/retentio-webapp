import HomePage from '@/components/home/HomePage'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  return <HomePage />
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('nav.home'),
  } satisfies Metadata
}
