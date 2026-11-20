import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const publishDeckAction = vi.hoisted(() => vi.fn())

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({ publishDeckAction }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/decks/DeckPublishPanel', () => ({
  PublishPreviewSummary: () => <div data-testid="summary" />,
}))

import DeckPublishSheet from '@/components/decks/DeckPublishSheet'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = (published_version: number) => ({ id: 'd1', name: 'Spanish', published_version }) as unknown as Deck

describe('DeckPublishSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('publishes a new deck and shows the published banner', async () => {
    publishDeckAction.mockResolvedValue({ success: true, data: { publishedVersion: 1 } })
    render(<DeckPublishSheet deck={deck(0)} preview={null} />)
    expect(screen.getByText('deck-menu.publish-deck')).toBeTruthy()
    expect(screen.getByText('Spanish')).toBeTruthy()
    expect(screen.getByText('deck-sharing.publish-description')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('deck-sharing.publish')))
    const [payload, , formData] = publishDeckAction.mock.calls[0]
    expect(payload).toEqual({ deckId: 'd1', currentVersion: 0 })
    expect((formData as FormData).get('version')).toBeNull()
    expect(screen.getByText('deck-menu.published')).toBeTruthy()
    expect(screen.getByText('v1')).toBeTruthy()
    expect(screen.queryByText('deck-sharing.publish')).toBeNull()
  })

  it('publishes the next version of a published deck with its change summary', async () => {
    publishDeckAction.mockResolvedValue({ success: true, data: {} })
    render(<DeckPublishSheet deck={deck(3)} preview={{ has_unpublished_changes: true } as never} />)
    expect(screen.getByTestId('summary')).toBeTruthy()
    expect(screen.getAllByText('deck-menu.publish-update')).toHaveLength(2)
    await act(async () => fireEvent.click(screen.getAllByText('deck-menu.publish-update')[1]))
    expect((publishDeckAction.mock.calls[0][2] as FormData).get('version')).toBe('4')
    expect(screen.getByText('v4')).toBeTruthy()
  })

  it('shows publish errors, with a fallback message', async () => {
    publishDeckAction
      .mockResolvedValueOnce({ success: false, error: 'Verify your email first' })
      .mockResolvedValueOnce(undefined)
    render(<DeckPublishSheet deck={deck(3)} preview={null} />)
    expect(screen.queryByTestId('summary')).toBeNull()
    await act(async () => fireEvent.click(screen.getAllByText('deck-menu.publish-update')[1]))
    expect(screen.getByTestId('error').textContent).toBe('Verify your email first')
    await act(async () => fireEvent.click(screen.getAllByText('deck-menu.publish-update')[1]))
    expect(screen.getByTestId('error').textContent).toBe('deck-menu.publish-failed')
  })
})
