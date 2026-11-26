import { getFactsPage } from '@/api/facts'
import type { Fact } from '@/modules/facts/facts.schema'

export const FACTS_BLOCK_SIZE = 100
export const FACTS_BLOCK_TTL_MS = 30_000
/** Facts are always listed oldest first. */
export const FACTS_SORT = 'created_at'

/** Grid rows: facts rounded up to a whole block, always leaving at least one empty row below the last fact. */
export function paddedRowCount(total: number) {
  return Math.ceil((total + 1) / FACTS_BLOCK_SIZE) * FACTS_BLOCK_SIZE
}

export interface FactsBlock {
  facts: Fact[]
  total: number
}

interface CachedBlock {
  at: number
  promise: Promise<FactsBlock>
}

// In-memory per tab: shares in-flight and recent blocks between the grid and next-block prefetch.
const cache = new Map<string, CachedBlock>()

function keyOf(deckId: string, offset: number) {
  return `${deckId}:${offset}`
}

function pruneExpired(now: number) {
  cache.forEach((block, key) => {
    if (now - block.at >= FACTS_BLOCK_TTL_MS) cache.delete(key)
  })
}

/** Stores a block fetched elsewhere (the server-rendered first block). */
export function seedFactsBlock(deckId: string, offset: number, block: FactsBlock) {
  cache.set(keyOf(deckId, offset), { at: Date.now(), promise: Promise.resolve(block) })
}

/** Loads the block at `offset`, reusing a cached or in-flight request for the same block. */
export function loadFactsBlock(deckId: string, offset: number): Promise<FactsBlock> {
  const now = Date.now()
  pruneExpired(now)
  const key = keyOf(deckId, offset)
  const hit = cache.get(key)
  if (hit) return hit.promise
  const promise = getFactsPage(deckId, { limit: FACTS_BLOCK_SIZE, offset, sort: FACTS_SORT })
    .then((res) => ({ facts: res.data.facts, total: res.meta.total }))
  cache.set(key, { at: now, promise })
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key)
  })
  return promise
}

/** Fetches the block after the one holding `lastVisibleRow` once it is within `threshold` rows of its end. */
export function prefetchNextFactsBlock(
  deckId: string,
  lastVisibleRow: number,
  total: number,
  threshold = 30,
) {
  const nextOffset = (Math.floor(lastVisibleRow / FACTS_BLOCK_SIZE) + 1) * FACTS_BLOCK_SIZE
  if (nextOffset >= total || nextOffset - lastVisibleRow > threshold) return
  loadFactsBlock(deckId, nextOffset).catch(() => {})
}

/** Drops every cached block of a deck after its facts or fields change. */
export function clearFactsBlocks(deckId: string) {
  cache.forEach((_, key) => {
    if (key.startsWith(`${deckId}:`)) cache.delete(key)
  })
}
