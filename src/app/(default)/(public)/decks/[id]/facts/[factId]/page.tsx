import FactsDetail from '@/components/facts/FactsDetail'
import { getDeckService } from '@/modules/decks/decks.service'
import { getFactService } from '@/modules/facts/facts.service'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/facts/[factId]'>) {
  const params = await props.params
  const id = params.id
  const factId = params.factId
  const deck = await getDeckService(id)
  if(!deck.success){
    notFound()
  }
  const fact = await getFactService(id, factId)
  if(!fact.success){
    notFound()
  }
  return (
    <FactsDetail
      deck={deck.data}
      fact={fact.data.fact}
    />
  )
}
