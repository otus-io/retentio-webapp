import SharedDecksDetail from '@/components/decks/SharedDecksDetail'
import { getDeckCatalogItemService } from '@/modules/deck-sharing/deck-sharing.service'
import { getAllDecksService } from '@/modules/decks/decks.service'
import { getToken } from '@/lib/token'
import { notFound } from 'next/navigation'
import AppError from '@/components/app/AppError'

export default async function Page(props: PageProps<'/decks/shared/[id]'>) {
  const id = (await props.params).id
  const deckCatalog = await getDeckCatalogItemService(id)

  if(!deckCatalog.success){
    if(deckCatalog.status === 404){
      notFound()
    }
    return <AppError page error={deckCatalog.message} />
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
