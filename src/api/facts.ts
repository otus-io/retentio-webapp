import { UpdateFactDTO } from '@/modules/facts/facts.schema'

/**
 *
 */
export async function updateFactsFields(id: string, factId: string, deck: UpdateFactDTO) {
  const res = await fetch(`/api/decks/${id}/facts/${factId}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deck),
  })
  return res.json()
}


