import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/utils/request'
import { getFactsPage } from '@/api/facts'

vi.mock('@/utils/request', () => ({
  request: vi.fn(),
}))

describe('facts api', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('builds the facts page query from the given params', () => {
    getFactsPage('d1')
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts')
    getFactsPage('d1', { limit: 100, offset: 300 })
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts?limit=100&offset=300')
    getFactsPage('d1', { limit: 100, offset: 0, sort: 'created_at' })
    expect(request).toHaveBeenLastCalledWith('/api/decks/d1/facts?limit=100&offset=0&sort=created_at')
  })
})
