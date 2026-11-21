import ClientOnly from '@/components/app/ClientOnly'
import QaSession from '@/components/qa/QaSession'
import { getDeckService } from '@/modules/decks/decks.service'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/qa'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if (!data.success) {
    notFound()
  }
  // Column picks live in localStorage, so render only on the client.
  return <ClientOnly><QaSession deck={data.data} /></ClientOnly>
}

export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('qa.title'),
  } satisfies Metadata
}
