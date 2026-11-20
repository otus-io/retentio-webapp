import { describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { getDeckUpdatesSummary, getPublishPreview } from '@/api/deck-sharing'

vi.mock('@/utils/request', () => ({ request: vi.fn() }))

describe('deck-sharing api', () => {
  it('gets the publish preview', () => {
    getPublishPreview('d1')
    expect(request).toHaveBeenCalledWith('/api/decks/d1/publish-preview')
  })

  it('gets the import updates summary', () => {
    getDeckUpdatesSummary('i1')
    expect(request).toHaveBeenCalledWith('/api/decks/i1/updates?summary=1')
  })
})
