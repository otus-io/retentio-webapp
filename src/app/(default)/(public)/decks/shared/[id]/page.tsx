import SharedDecksDetail from '@/components/decks/SharedDecksDetail'
import { getDeckCatalogItemService } from '@/modules/deck-sharing/deck-sharing.service'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/shared/[id]'>) {
  const id = (await props.params).id
  const deckCatalog = await getDeckCatalogItemService(id)
  if(!deckCatalog.success){
    notFound()
  }
  return (
    <SharedDecksDetail deck={deckCatalog.data} />
  )
}
