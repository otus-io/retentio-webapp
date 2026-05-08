import DecksForm from '@/components/decks/DecksForm'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default function Page() {
  return <DecksForm type="create" data={null} />
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('common.create', { name: t('term.decks') }),
  } satisfies Metadata
}
