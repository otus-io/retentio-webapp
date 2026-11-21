import { showFailToast, showSuccessToast } from '@/lib/ui'
import { submitDeckContributionsBatchAction } from '@/modules/contributions/contributions.action'
import type {
  PendingDeckContribution,
  SentDeckContribution,
  SubmitDeckContributionsBatchResult,
} from '@/modules/contributions/contributions.schema'
import {
  isPendingContribution,
  isSentContribution,
  pendingStorageKey,
  readContributions,
  sentStorageKey,
  previewFromEntries,
  writeContributions,
} from '@/modules/contributions/pending-contributions'
import type { Entry } from '@/modules/facts/facts.schema'

/**
 * Sends changes on an imported deck to its author right away, as the mobile app does. Each change is queued first,
 * so one that cannot be sent (offline, unverified email, …) stays in Unsent contributions for a retry.
 * Runs in the browser, where the outbox lives.
 */
export async function sendToAuthor(deckId: string, contributions: PendingDeckContribution[]) {
  const pendingKey = pendingStorageKey(deckId)
  const ids = new Set(contributions.map((c) => c.id))
  const queued = readContributions(pendingKey, isPendingContribution).filter((c) => !ids.has(c.id))
  writeContributions(pendingKey, [...queued, ...contributions])

  let submitted: SubmitDeckContributionsBatchResult['submitted'] = []
  try {
    const result = await submitDeckContributionsBatchAction(
      { importDeckId: deckId, contributions },
      null,
      new FormData(),
    )
    // Count only results for what was sent in this call.
    if (result?.success && result.data) submitted = result.data.submitted.filter((s) => ids.has(s.localId))
  } catch {
    // Offline or a failed request: everything stays queued for a retry.
  }
  if (submitted.length > 0) {
    const sentIds = new Set<string>(submitted.map((s) => s.localId))
    // Re-read: other tabs or edits may have changed the outbox while this was sending.
    const stillPending = readContributions(pendingKey, isPendingContribution).filter((c) => !sentIds.has(c.id))
    writeContributions(pendingKey, stillPending)
    const sentAt = new Date().toISOString()
    const sentKey = sentStorageKey(deckId)
    const newlySent = submitted.map((s, i): SentDeckContribution => ({
      id: `${s.kind}:${Date.now() + i}`,
      kind: s.kind,
      preview: contributions.find((c) => c.id === s.localId)?.preview ?? '',
      contributionId: s.contributionId,
      sentAt,
    }))
    writeContributions(sentKey, [...readContributions(sentKey, isSentContribution), ...newlySent])
  }
  return { sent: submitted.length, unsent: contributions.length - submitted.length }
}

/** A queued fact edit or new fact for [sendToAuthor]. */
export function factContribution(
  kind: 'fact_edit' | 'fact_add',
  factId: string,
  preview: string,
): PendingDeckContribution {
  return { id: `${kind}:${factId}`, kind, factId, preview, savedAt: new Date().toISOString() }
}

/** Sends saved fact edits on an imported deck to the author, one contribution per fact. */
export function sendFactEdits(deckId: string, edits: { factId: string, entries: Entry[] }[]) {
  return sendToAuthor(deckId, edits.map(({ factId, entries }) =>
    factContribution('fact_edit', factId, previewFromEntries(entries))))
}

/** Sends saved fact edits and tells the user whether they reached the author. */
export async function sendFactEditsAndNotify(
  deckId: string,
  edits: { factId: string, entries: Entry[] }[],
  messages: { sent: string, unsent: string },
) {
  const { unsent } = await sendFactEdits(deckId, edits)
  if (unsent > 0) showFailToast(messages.unsent)
  else showSuccessToast(messages.sent)
}
