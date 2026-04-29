import { CreateOrUpdateDeckDTO } from '@/modules/decks/decks.schema'

/**
 *
 */
export function updateDecksFields(id: string, deck: CreateOrUpdateDeckDTO) {
  return fetch(`/api/decks/${id}/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deck),
  })
}
