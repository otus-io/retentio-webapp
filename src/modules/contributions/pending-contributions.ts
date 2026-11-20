import type { PendingDeckContribution, SentDeckContribution } from '@/modules/contributions/contributions.schema'
import type { Entry } from '@/modules/facts/facts.schema'

/** Imported decks keep unsent and sent contributions in this browser, like the mobile app does per device. */
export const pendingStorageKey = (deckId: string) => `retentio_pending_contribs_v2:${deckId}`
export const sentStorageKey = (deckId: string) => `retentio_sent_contribs_v1:${deckId}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function isPendingContribution(value: unknown): value is PendingDeckContribution {
  if (!isRecord(value) || typeof value.preview !== 'string' || typeof value.savedAt !== 'string') return false
  if (value.id === 'deck_tags' && value.kind === 'deck_tags') {
    return isStringArray(value.addTags) && isStringArray(value.removeTags)
  }
  if ((value.kind === 'fact_edit' || value.kind === 'fact_add') && typeof value.factId === 'string') {
    return value.id === `${value.kind}:${value.factId}`
  }
  return value.id === 'field_rename' && value.kind === 'field_rename' && isStringArray(value.proposedFields)
}

export function isSentContribution(value: unknown): value is SentDeckContribution {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.kind === 'string' && ['deck_tags', 'field_rename', 'fact_edit', 'fact_add'].includes(value.kind)
    && typeof value.preview === 'string'
    && typeof value.contributionId === 'string'
    && typeof value.sentAt === 'string'
}

export function readContributions<T>(key: string, guard: (value: unknown) => value is T) {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter(guard) : []
  } catch {
    return []
  }
}

export function writeContributions(key: string, value: PendingDeckContribution[] | SentDeckContribution[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Short preview of a fact for the outbox, from its entry texts. */
export function previewFromEntries(entries: Entry[]) {
  const text = entries.map((e) => e.text?.trim()).filter(Boolean).join(' · ')
  return text.length > 80 ? `${text.slice(0, 79)}…` : text
}
