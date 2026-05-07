import FactsForm from '@/components/facts/FactsForm'
import { getDeckService } from '@/modules/decks/decks.service'
import { getFactService } from '@/modules/facts/facts.service'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/facts/[factId]/edit'>) {
  const id = (await props.params).id
  const factId = (await props.params).factId
  const deck = await getDeckService(id)
  if(!deck.success){
    notFound()
  }
  const fact = await getFactService(id, factId)
  if(!fact.success){
    notFound()
  }
  return <FactsForm type="update" deck={deck.data} fact={fact.data.fact} />
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('common.update', { name: t('term.facts') }),
  } satisfies Metadata
}
