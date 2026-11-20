import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  createFactsService: vi.fn(),
  deleteFactService: vi.fn(),
  deleteFactsService: vi.fn(),
  getFactService: vi.fn(),
  updateFactService: vi.fn(),
}))
const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('@/modules/facts/facts.service', () => services)
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { getFactAction, updateFactEntriesAction } from '@/modules/facts/facts.action'

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
