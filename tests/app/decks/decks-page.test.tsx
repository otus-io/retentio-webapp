import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const list = vi.fn()
const services = vi.hoisted(() => ({ getAllDecksService: vi.fn(), getDeckSharingStatusesService: vi.fn() }))

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/decks/decks.service', () => ({ getAllDecksService: services.getAllDecksService }))
vi.mock('@/modules/deck-sharing/deck-sharing.service', () => ({
  getDeckSharingStatusesService: services.getDeckSharingStatusesService,
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error: string }) => <div data-testid="error">{error}</div>,
}))
vi.mock('@/components/decks/DecksList', () => ({
  default: (props: unknown) => {
    list(props)
    return null
  },
}))

import Page from '@/app/(default)/decks/page'

describe('My Decks page', () => {
  it('passes each deck its sharing badges', async () => {
    const decks = [{ id: 'd1' }]
    const sharing = { d1: { flash: true, openContributions: false } }
    services.getAllDecksService.mockResolvedValueOnce({ success: true, data: { decks } })
    services.getDeckSharingStatusesService.mockResolvedValueOnce(sharing)
    render(await Page())
    expect(services.getDeckSharingStatusesService).toHaveBeenCalledWith(decks)
    expect(list).toHaveBeenLastCalledWith({ data: decks, sharing })
  })

  it('handles a missing deck list and load errors', async () => {
    services.getAllDecksService.mockResolvedValueOnce({ success: true, data: {} })
    services.getDeckSharingStatusesService.mockResolvedValueOnce({})
    render(await Page())
    expect(list).toHaveBeenLastCalledWith({ data: [], sharing: {} })

    services.getAllDecksService.mockResolvedValueOnce({ success: false, message: 'boom' })
    const { getByTestId } = render(await Page())
    expect(getByTestId('error').textContent).toBe('boom')
  })
})
