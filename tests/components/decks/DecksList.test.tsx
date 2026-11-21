import { act, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getDeckSharingStatusesAction = vi.hoisted(() => vi.fn())

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({ getDeckSharingStatusesAction }))
const { Pass } = vi.hoisted(() => ({ Pass: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/layout/LayoutPage', () => ({ default: Pass }))
vi.mock('@/components/app/AppLink', () => ({ default: Pass }))
vi.mock('@/components/app/AppTooltip', () => ({ default: Pass }))
vi.mock('@/components/decks/DecksSearch', () => ({ DecksSearch: () => null }))
vi.mock('@/components/decks/DeckCreateButton', () => ({ default: () => null }))
vi.mock('@/components/decks/DeckImportButton', () => ({ default: () => null }))
vi.mock('@/components/decks/DecksCard', () => ({
  default: ({ deck, sharing }: { deck: { id: string }, sharing?: unknown }) => (
    <div data-testid={`card-${deck.id}`}>{JSON.stringify(sharing ?? null)}</div>
  ),
}))

import DecksList from '@/components/decks/DecksList'
import type { Deck } from '@/modules/decks/decks.schema'

const decks = [{ id: 'd1', name: 'Spanish' }, { id: 'd2', name: 'French' }] as unknown as Deck[]

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
}

describe('DecksList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVisibility('visible')
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the cards first, then gives each its sharing badges', async () => {
    getDeckSharingStatusesAction.mockResolvedValue({ d1: { flash: true, openContributions: false } })
    render(<DecksList data={decks} />)
    expect(screen.getByTestId('card-d1').textContent).toBe('null')
    const badges = '{"flash":true,"openContributions":false}'
    await waitFor(() => expect(screen.getByTestId('card-d1').textContent).toBe(badges))
    expect(screen.getByTestId('card-d2').textContent).toBe('null')
    expect(getDeckSharingStatusesAction).toHaveBeenCalledWith()
  })

  it('re-checks every minute and when the tab comes back, but not while hidden', async () => {
    vi.useFakeTimers()
    getDeckSharingStatusesAction.mockResolvedValue({})
    const { unmount } = render(<DecksList data={decks} />)
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(1)
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(2)

    setVisibility('hidden')
    await act(async () => { vi.advanceTimersByTime(60_000) })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(2)
    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(3)

    unmount()
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(3)
  })

  it('keeps the previous badges when a check fails, and lets only the newest check win', async () => {
    let resolveOld!: (v: unknown) => void
    getDeckSharingStatusesAction
      .mockResolvedValueOnce({ d1: { flash: true, openContributions: false } })
      .mockRejectedValueOnce(new Error('Failed to find Server Action'))
      .mockReturnValueOnce(new Promise((r) => { resolveOld = r }))
      .mockResolvedValueOnce({ d1: { flash: false, openContributions: true } })
    const badges = (flash: boolean, open: boolean) => `{"flash":${flash},"openContributions":${open}}`
    render(<DecksList data={decks} />)
    await waitFor(() => expect(screen.getByTestId('card-d1').textContent).toBe(badges(true, false)))

    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(screen.getByTestId('card-d1').textContent).toBe(badges(true, false))

    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(screen.getByTestId('card-d1').textContent).toBe(badges(false, true)))
    await act(async () => resolveOld({ d1: { flash: true, openContributions: true } }))
    expect(screen.getByTestId('card-d1').textContent).toBe(badges(false, true))
  })

  it('does not re-check when the page refreshes with the same decks', async () => {
    getDeckSharingStatusesAction.mockResolvedValue({})
    const { rerender } = render(<DecksList data={decks} />)
    rerender(<DecksList data={[...decks]} />)
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(1)
    rerender(<DecksList data={[decks[0]]} />)
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(2)
    // Publishing or syncing changes the deck's versions, which re-checks its badges.
    rerender(<DecksList data={[{ ...decks[0], published_version: 2 } as Deck]} />)
    expect(getDeckSharingStatusesAction).toHaveBeenCalledTimes(3)
  })

  it('ignores badges that arrive after leaving the page', async () => {
    let resolve!: (v: unknown) => void
    getDeckSharingStatusesAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { unmount } = render(<DecksList data={decks} />)
    unmount()
    await act(async () => resolve({ d1: { flash: true, openContributions: true } }))
    expect(screen.queryByTestId('card-d1')).toBeNull()
  })
})
