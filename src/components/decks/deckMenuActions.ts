import type { DecksActionItem } from '@/components/decks/DecksAction'
import type { Deck } from '@/modules/decks/decks.schema'

/** The deck menu, as on mobile: own decks publish and review contributions; imports send and sync. */
export function deckMenuActions(deck: Deck): DecksActionItem[] {
  if (deck.source_deck_id) return ['details', 'facts', 'edit', 'outbox', 'updates', 'qa', 'delete']
  const published = deck.published_version > 0
  return ['details', 'facts', 'edit', 'publish', ...(published ? ['inbox' as const] : []), 'qa', 'delete']
}
