import AppError from '@/components/app/AppError'
import { getAllDecksService } from '@/modules/decks/decks.service'
import DecksList from '@/components/decks/DecksList'

export default async function Page() {
  const { data, success, message } = await getAllDecksService()
  if(!success){
    return (
      <div className="py-4 max-w-content mx-auto px-3.5">
        <AppError error={message} />
      </div>
    )
  }
  return (
    <div className="py-4 max-w-content mx-auto px-3.5">
      <DecksList data={data?.decks || []} />
    </div>
  )
}
