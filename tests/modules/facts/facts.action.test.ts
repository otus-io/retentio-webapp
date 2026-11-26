import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  createFactsService: vi.fn(),
  deleteFactService: vi.fn(),
  getFactService: vi.fn(),
  getFactIdsService: vi.fn(),
  updateFactService: vi.fn(),
}))
const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('@/modules/facts/facts.service', () => services)
vi.mock('next/cache', () => ({ revalidatePath }))
const redirect = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect }))

import { addFactAction, deleteFactAction, getFactAction, updateFactEntriesAction } from '@/modules/facts/facts.action'

describe('study fact actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getFactAction returns the fact or the error', async () => {
    const fact = { id: 'f1', entries: [{ text: 'hola' }] }
    services.getFactService.mockResolvedValueOnce({ success: true, data: { fact } })
    expect(await getFactAction('d1', 'f1')).toEqual({ success: true, data: fact })
    expect(services.getFactService).toHaveBeenCalledWith('d1', 'f1')

    services.getFactService.mockResolvedValueOnce({ success: false, message: 'Fact not found' })
    expect(await getFactAction('d1', 'f1')).toEqual({ success: false, error: 'Fact not found' })
  })

  it('updateFactEntriesAction patches only the entries and does not redirect', async () => {
    const entries = [{ text: 'hola', audio: 'a1' }, {}]
    services.updateFactService.mockResolvedValueOnce({ success: true, data: { fact_id: 'f1' } })
    expect(await updateFactEntriesAction('d1', 'f1', entries)).toEqual({ success: true })
    expect(services.updateFactService).toHaveBeenCalledWith('d1', 'f1', { entries })
    expect(revalidatePath).toHaveBeenCalledWith('/decks/d1/facts')

    services.updateFactService.mockResolvedValueOnce({ success: false, message: 'Forbidden' })
    expect(await updateFactEntriesAction('d1', 'f1', entries)).toEqual({ success: false, error: 'Forbidden' })
  })
})

describe('deleteFactAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes, refreshes the facts page and does not redirect', async () => {
    services.deleteFactService.mockResolvedValueOnce({ success: true })
    expect(await deleteFactAction({ deckId: 'd1', factId: 'f1' }, null, new FormData())).toEqual({ success: true })
    expect(services.deleteFactService).toHaveBeenCalledWith('d1', 'f1')
    expect(revalidatePath).toHaveBeenCalledWith('/decks/d1/facts')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('returns the service error or a thrown error', async () => {
    services.deleteFactService.mockResolvedValueOnce({ success: false, message: 'Forbidden' })
    expect(await deleteFactAction({ deckId: 'd1', factId: 'f1' }, null, new FormData()))
      .toEqual({ success: false, error: 'Forbidden' })
    services.deleteFactService.mockRejectedValueOnce(new Error('offline'))
    expect(await deleteFactAction({ deckId: 'd1', factId: 'f1' }, null, new FormData()))
      .toMatchObject({ success: false })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('updateFactEntriesAction validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects malformed entries without calling the API', async () => {
    const state = await updateFactEntriesAction('d1', 'f1', [{ text: 1 }] as never)
    expect(state.success).toBe(false)
    expect(String(state.error)).toContain('text')
    expect(services.updateFactService).not.toHaveBeenCalled()
  })

  it('keeps json on entries it forwards', async () => {
    services.updateFactService.mockResolvedValueOnce({ success: true, data: { fact_id: 'f1' } })
    const entries = [{ text: 'a', json: '{"k":1}' }] as never
    await updateFactEntriesAction('d1', 'f1', entries)
    expect(services.updateFactService).toHaveBeenCalledWith('d1', 'f1', { entries: [{ text: 'a', json: '{"k":1}' }] })
  })
})

describe('addFactAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('appends one fact, with the sign-off only when checked', async () => {
    services.createFactsService.mockResolvedValue({ success: true, data: { fact_length: 1 } })
    expect(await addFactAction('d1', [{ text: 'hola' }, { text: 'hello' }], true))
      .toEqual({ success: true, data: { newFactIds: [] } })
    expect(services.getFactIdsService).not.toHaveBeenCalled()
    expect(services.createFactsService).toHaveBeenLastCalledWith('d1', {
      facts: [{ entries: [{ text: 'hola' }, { text: 'hello' }] }],
      operation: 'append',
      verified: true,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/decks/d1/facts')
    await addFactAction('d1', [{ text: 'hola' }], false)
    expect(services.createFactsService.mock.lastCall?.[1]).not.toHaveProperty('verified', false)
  })

  it('finds the new fact on an imported deck by comparing ids', async () => {
    services.createFactsService.mockResolvedValue({ success: true, data: { fact_length: 3 } })
    services.getFactIdsService
      .mockResolvedValueOnce({ success: true, data: { fact_ids: ['a', 'b'] } })
      .mockResolvedValueOnce({ success: true, data: { fact_ids: ['a', 'b', 'c'] } })
    expect(await addFactAction('i1', [{ text: 'hola' }], false, true))
      .toEqual({ success: true, data: { newFactIds: ['c'] } })

    services.getFactIdsService
      .mockResolvedValueOnce({ success: true, data: { fact_ids: ['a'] } })
      .mockResolvedValueOnce({ success: false, message: 'x' })
    expect(await addFactAction('i1', [{ text: 'hola' }], false, true))
      .toEqual({ success: true, data: { newFactIds: [], idsUnknown: true } })

    services.getFactIdsService.mockResolvedValueOnce({ success: false, message: 'x' })
    expect(await addFactAction('i1', [{ text: 'hola' }], false, true))
      .toEqual({ success: true, data: { newFactIds: [], idsUnknown: true } })
  })

  it('returns validation and backend errors', async () => {
    expect((await addFactAction('d1', [], false)).success).toBe(false)
    expect(services.createFactsService).not.toHaveBeenCalled()
    services.createFactsService.mockResolvedValueOnce({ success: false, message: 'Forbidden' })
    expect(await addFactAction('d1', [{ text: 'a' }], false)).toEqual({ success: false, error: 'Forbidden' })
  })
})
