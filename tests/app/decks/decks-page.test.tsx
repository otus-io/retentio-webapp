import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const list = vi.fn()
const getAllDecksService = vi.hoisted(() => vi.fn())

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/modules/decks/decks.service', () => ({ getAllDecksService }))
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
  it('renders the decks without waiting for sharing badges', async () => {
    getAllDecksService.mockResolvedValueOnce({ success: true, data: { decks: [{ id: 'd1' }] } })
    render(await Page())
    expect(list).toHaveBeenLastCalledWith({ data: [{ id: 'd1' }] })

    getAllDecksService.mockResolvedValueOnce({ success: true, data: {} })
    render(await Page())
    expect(list).toHaveBeenLastCalledWith({ data: [] })
  })

  it('shows load errors', async () => {
    getAllDecksService.mockResolvedValueOnce({ success: false, message: 'boom' })
    const { getByTestId } = render(await Page())
    expect(getByTestId('error').textContent).toBe('boom')
  })
})
