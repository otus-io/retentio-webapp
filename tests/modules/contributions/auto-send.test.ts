import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitDeckContributionsBatchAction = vi.hoisted(() => vi.fn())
vi.mock('@/modules/contributions/contributions.action', () => ({ submitDeckContributionsBatchAction }))

import { factContribution, sendFactEdits, sendToAuthor } from '@/modules/contributions/auto-send'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
  }
}
const stored = (key: string) => JSON.parse(localStorage.getItem(`${key}:i1`) ?? '[]')

describe('sendToAuthor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('sends right away and records what reached the author', async () => {
    submitDeckContributionsBatchAction.mockResolvedValue({
      success: true,
      data: { submitted: [{ localId: 'fact_edit:f1', kind: 'fact_edit', contributionId: 'c1' }], failed: [] },
    })
    const result = await sendToAuthor('i1', [factContribution('fact_edit', 'f1', 'hola')])
    expect(result).toEqual({ sent: 1, unsent: 0 })
    expect(stored('retentio_pending_contribs_v2')).toEqual([])
    expect(stored('retentio_sent_contribs_v1'))
      .toMatchObject([{ kind: 'fact_edit', preview: 'hola', contributionId: 'c1' }])
  })

  it('keeps unsent changes queued, replacing an older queued copy of the same fact', async () => {
    submitDeckContributionsBatchAction.mockResolvedValue({ success: false, error: 'Offline' })
    await sendToAuthor('i1', [factContribution('fact_edit', 'f1', 'first')])
    await sendToAuthor('i1', [factContribution('fact_edit', 'f1', 'second'), factContribution('fact_add', 'f2', 'new')])
    expect(stored('retentio_pending_contribs_v2').map((c: { preview: string }) => c.preview)).toEqual(['second', 'new'])
  })

  it('counts only results for this call, and survives a failed request', async () => {
    submitDeckContributionsBatchAction.mockResolvedValueOnce({
      success: true,
      data: { submitted: [{ localId: 'deck_tags', kind: 'deck_tags', contributionId: 'cx' }], failed: [] },
    })
    expect(await sendToAuthor('i1', [factContribution('fact_add', 'f3', 'x')])).toEqual({ sent: 0, unsent: 1 })
    submitDeckContributionsBatchAction.mockRejectedValueOnce(new Error('Failed to fetch'))
    expect(await sendToAuthor('i1', [factContribution('fact_add', 'f4', 'y')])).toEqual({ sent: 0, unsent: 1 })
    submitDeckContributionsBatchAction.mockResolvedValueOnce({ success: true })
    expect(await sendToAuthor('i1', [factContribution('fact_add', 'f5', 'z')])).toEqual({ sent: 0, unsent: 1 })
    expect(stored('retentio_pending_contribs_v2')).toHaveLength(3)
  })

  it('sendFactEdits sends one edit per fact with a preview of its text', async () => {
    submitDeckContributionsBatchAction.mockResolvedValue({ success: false })
    await sendFactEdits('i1', [{ factId: 'f1', entries: [{ text: 'hola' }, { text: 'hello' }] }])
    expect(submitDeckContributionsBatchAction.mock.calls[0][0].contributions)
      .toEqual([expect.objectContaining({ id: 'fact_edit:f1', factId: 'f1', preview: 'hola · hello' })])
  })
})
