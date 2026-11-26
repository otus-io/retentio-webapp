import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFactsPage } from '@/api/facts'
import {
  clearFactsBlocks,
  FACTS_BLOCK_TTL_MS,
  loadFactsBlock,
  paddedRowCount,
  prefetchNextFactsBlock,
  seedFactsBlock,
} from '@/components/facts/factsBlockCache'

vi.mock('@/api/facts', () => ({ getFactsPage: vi.fn() }))

const fact = (id: string) => ({ id, entries: [], fields: [], tags: [] })

function respond(total = 250) {
  vi.mocked(getFactsPage).mockImplementation(async (_deckId, params) => ({
    data: { facts: [fact(`f${params?.offset}`)] },
    meta: { msg: 'ok', count: 1, has_more: true, limit: 100, offset: params?.offset ?? 0, total },
  }))
}

describe('factsBlockCache', () => {
  beforeEach(() => {
    vi.mocked(getFactsPage).mockReset()
    clearFactsBlocks('d1')
    clearFactsBlocks('d2')
    respond()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads a block by offset, oldest first', async () => {
    await expect(loadFactsBlock('d1', 200)).resolves.toEqual({ facts: [fact('f200')], total: 250 })
    expect(getFactsPage).toHaveBeenCalledWith('d1', { limit: 100, offset: 200, sort: 'created_at' })
  })

  it('shares in-flight and cached requests for the same block', async () => {
    const a = loadFactsBlock('d1', 100)
    const b = loadFactsBlock('d1', 100)
    expect(a).toBe(b)
    await a
    await loadFactsBlock('d1', 100)
    expect(getFactsPage).toHaveBeenCalledTimes(1)
  })

  it('refetches a block once it expires', async () => {
    vi.useFakeTimers()
    await loadFactsBlock('d1', 0)
    vi.advanceTimersByTime(FACTS_BLOCK_TTL_MS)
    await loadFactsBlock('d1', 0)
    expect(getFactsPage).toHaveBeenCalledTimes(2)
  })

  it('drops a failed request so the next load retries', async () => {
    vi.mocked(getFactsPage).mockRejectedValueOnce(new Error('boom'))
    await expect(loadFactsBlock('d1', 0)).rejects.toThrow('boom')
    await expect(loadFactsBlock('d1', 0)).resolves.toMatchObject({ total: 250 })
    expect(getFactsPage).toHaveBeenCalledTimes(2)
  })

  it('keeps a newer entry when an older failed request settles', async () => {
    let reject!: (e: Error) => void
    vi.mocked(getFactsPage).mockImplementationOnce(() => new Promise((_, r) => { reject = r }))
    const failing = loadFactsBlock('d1', 0)
    seedFactsBlock('d1', 0, { facts: [], total: 7 })
    reject(new Error('boom'))
    await expect(failing).rejects.toThrow('boom')
    await expect(loadFactsBlock('d1', 0)).resolves.toEqual({ facts: [], total: 7 })
  })

  it('serves a seeded block without fetching', async () => {
    seedFactsBlock('d1', 0, { facts: [fact('s')], total: 9 })
    await expect(loadFactsBlock('d1', 0)).resolves.toEqual({ facts: [fact('s')], total: 9 })
    expect(getFactsPage).not.toHaveBeenCalled()
  })

  it('clears only the given deck', async () => {
    await loadFactsBlock('d1', 0)
    await loadFactsBlock('d2', 0)
    clearFactsBlocks('d1')
    await loadFactsBlock('d1', 0)
    await loadFactsBlock('d2', 0)
    expect(getFactsPage).toHaveBeenCalledTimes(3)
  })

  describe('prefetchNextFactsBlock', () => {
    it('fetches the next block within the threshold of the current block end', () => {
      prefetchNextFactsBlock('d1', 69, 250)
      expect(getFactsPage).not.toHaveBeenCalled()
      prefetchNextFactsBlock('d1', 70, 250)
      expect(getFactsPage).toHaveBeenCalledWith('d1', { limit: 100, offset: 100, sort: 'created_at' })
    })

    it('does not refetch a block already loading', () => {
      prefetchNextFactsBlock('d1', 90, 250)
      prefetchNextFactsBlock('d1', 95, 250)
      expect(getFactsPage).toHaveBeenCalledTimes(1)
    })

    it('stops at the last block', () => {
      prefetchNextFactsBlock('d1', 290, 250)
      prefetchNextFactsBlock('d1', 95, 100)
      expect(getFactsPage).not.toHaveBeenCalled()
    })

    it('swallows prefetch failures', async () => {
      vi.mocked(getFactsPage).mockRejectedValueOnce(new Error('offline'))
      expect(() => prefetchNextFactsBlock('d1', 90, 250)).not.toThrow()
      await vi.waitFor(() => expect(getFactsPage).toHaveBeenCalledTimes(1))
    })
  })

  it('pads row counts up to a whole block, always leaving an empty row', () => {
    expect([0, 1, 99, 100, 101, 2560, 2600].map(paddedRowCount)).toEqual([100, 100, 100, 200, 200, 2600, 2700])
  })
})
