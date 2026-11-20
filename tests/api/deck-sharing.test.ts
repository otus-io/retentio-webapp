import { describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { getPublishPreview } from '@/api/deck-sharing'

vi.mock('@/utils/request', () => ({ request: vi.fn() }))

describe('deck-sharing api', () => {
  it('gets the publish preview', () => {
    getPublishPreview('d1')
    expect(request).toHaveBeenCalledWith('/api/decks/d1/publish-preview')
  })
})
