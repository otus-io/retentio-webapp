import { describe, expect, it, vi } from 'vitest'
import * as api from '@/api/deck-sharing'
import { getContributionsService } from '@/modules/contributions/contributions.service'
import {
  getDeckSharingStatusesService,
  getDeckUpdateFactService,
  getDeckUpdatesSummaryService,
  getPublishPreviewService,
} from '@/modules/deck-sharing/deck-sharing.service'
import type { Deck } from '@/modules/decks/decks.schema'
import { RequestError } from '@/utils/request'

vi.mock('@/api/deck-sharing', () => ({ getPublishPreview: vi.fn(), getDeckUpdatesSummary: vi.fn(), getDeckUpdateFact: vi.fn() }))
vi.mock('@/modules/contributions/contributions.service', () => ({ getContributionsService: vi.fn() }))

const ok = (data: unknown) => ({ data, meta: { msg: 'ok' } }) as never

describe('getPublishPreviewService', () => {
  it('wraps success and failure', async () => {
    vi.mocked(api.getPublishPreview).mockResolvedValueOnce(ok({ has_unpublished_changes: true }))
    expect(await getPublishPreviewService('d1')).toMatchObject({ success: true, data: { has_unpublished_changes: true } })
    vi.mocked(api.getPublishPreview).mockRejectedValueOnce(new RequestError('Not authorized', 403))
    expect(await getPublishPreviewService('d1')).toMatchObject({ success: false, status: 403 })
  })
})

describe('getDeckUpdatesSummaryService', () => {
  it('wraps success and failure', async () => {
    vi.mocked(api.getDeckUpdatesSummary).mockResolvedValueOnce(ok({ source_version: 1, latest_version: 2 }))
    expect(await getDeckUpdatesSummaryService('i1')).toMatchObject({ success: true, data: { latest_version: 2 } })
    vi.mocked(api.getDeckUpdatesSummary).mockRejectedValueOnce(new RequestError('Not found', 404))
    expect(await getDeckUpdatesSummaryService('i1')).toMatchObject({ success: false, status: 404 })
  })
})

describe('getDeckUpdateFactService', () => {
  it('wraps success and failure', async () => {
    vi.mocked(api.getDeckUpdateFact).mockResolvedValueOnce(ok({ kind: 'edited' }))
    expect(await getDeckUpdateFactService('i1', 'f1')).toMatchObject({ success: true, data: { kind: 'edited' } })
    vi.mocked(api.getDeckUpdateFact).mockRejectedValueOnce(new RequestError('Not found', 404))
    expect(await getDeckUpdateFactService('i1', 'f1')).toMatchObject({ success: false, status: 404 })
  })
})

describe('getDeckSharingStatusesService', () => {
  const deck = (id: string, over: Record<string, unknown> = {}) =>
    ({ id, published_version: 0, ...over }) as unknown as Deck

  it('flags imports with updates and published sources with changes or open contributions', async () => {
    vi.mocked(api.getDeckUpdatesSummary).mockImplementation(async (id: string) => ok({
      i1: { source_version: 1, latest_version: 2 },
      i2: { source_version: 2, latest_version: 2, edited_fact_ids: ['f1'] },
      i3: { source_version: 2, latest_version: 2, added_fact_ids: [], media_change_count: 0 },
    }[id]))
    vi.mocked(api.getPublishPreview)
      .mockImplementation(async (id: string) => ok({ has_unpublished_changes: id === 's1' }))
    vi.mocked(getContributionsService).mockImplementation(async (id: string) => (
      id === 's2'
        ? { success: true, data: { contributions: [{ id: 'c1' }] } }
        : { success: true, data: { contributions: [] } }
    ) as never)

    const statuses = await getDeckSharingStatusesService([
      deck('i1', { source_deck_id: 'x' }),
      deck('i2', { source_deck_id: 'x' }),
      deck('i3', { source_deck_id: 'x' }),
      deck('s1', { published_version: 1 }),
      deck('s2', { published_version: 3 }),
      deck('draft'),
    ])
    expect(statuses).toEqual({
      i1: { flash: true, openContributions: false },
      i2: { flash: true, openContributions: false },
      i3: { flash: false, openContributions: false },
      s1: { flash: true, openContributions: false },
      s2: { flash: false, openContributions: true },
      draft: { flash: false, openContributions: false },
    })
    expect(getContributionsService).toHaveBeenCalledWith('s1', { status: 'open', limit: 1 })
  })

  it('shows no badge when a check fails', async () => {
    vi.mocked(api.getDeckUpdatesSummary).mockRejectedValueOnce(new Error('network'))
    vi.mocked(api.getPublishPreview).mockRejectedValueOnce(new Error('network'))
    vi.mocked(getContributionsService).mockResolvedValueOnce({ success: false, message: 'x' } as never)
    const decks = [deck('i1', { source_deck_id: 'x' }), deck('s1', { published_version: 1 })]
    expect(await getDeckSharingStatusesService(decks))
      .toEqual({ i1: { flash: false, openContributions: false }, s1: { flash: false, openContributions: false } })
  })

  it('returns no badges if anything throws', async () => {
    vi.mocked(getContributionsService).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(api.getPublishPreview).mockResolvedValueOnce(ok({ has_unpublished_changes: false }))
    expect(await getDeckSharingStatusesService([deck('s1', { published_version: 1 })])).toEqual({})
  })
})
