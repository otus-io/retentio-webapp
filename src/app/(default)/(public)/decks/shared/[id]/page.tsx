import SharedDecksDetail from '@/components/decks/SharedDecksDetail'
import { getDeckCatalogItemService } from '@/modules/deck-sharing/deck-sharing.service'
import { getAllDecksService } from '@/modules/decks/decks.service'
import { getToken } from '@/lib/token'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/shared/[id]'>) {
  const id = (await props.params).id
  const deckCatalog = await getDeckCatalogItemService(id)
  if(!deckCatalog.success){
    notFound()
  }

  let importedDeckId: string | null = null
  if (await getToken()) {
    const decks = await getAllDecksService()
    if (decks.success) {
      importedDeckId = decks.data.decks.find((deck) => deck.source_deck_id === id)?.id ?? null
    }
  }

  return (
    <SharedDecksDetail deck={deckCatalog.data} importedDeckId={importedDeckId} />
  )
}
