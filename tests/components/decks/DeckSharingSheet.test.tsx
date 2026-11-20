import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
const actions = vi.hoisted(() => ({
  getPublishPreviewAction: vi.fn(),
}))

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
// The real Modal.Backdrop closes through onOpenChange; expose that as a button.
vi.mock('@heroui/react', async () => {
  const base = (await import('../../helpers/heroui')).herouiMock()
  const Backdrop = ({ children, onOpenChange }: { children: ReactNode, onOpenChange: (open: boolean) => void }) => (
    <div role="dialog">
      <button type="button" onClick={() => onOpenChange(true)}>keep-open</button>
      <button type="button" onClick={() => onOpenChange(false)}>dismiss</button>
      {children}
    </div>
  )
  const Modal = new Proxy(Reflect.get(base, 'Modal'), {
    get: (m, k) => (k === 'Backdrop' ? Backdrop : Reflect.get(m, k)),
  })
  return new Proxy(base, { get: (target, key) => (key === 'Modal' ? Modal : Reflect.get(target, key)) })
})
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => ({
  getPublishPreviewAction: actions.getPublishPreviewAction,
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/decks/DeckPublishSheet', () => ({
  default: ({ preview }: { preview: unknown }) => <div data-testid="publish">{JSON.stringify(preview)}</div>,
}))
vi.mock('@/components/decks/DeckImportUpdatesSheet', () => ({
  default: ({ importId }: { importId: string }) => <div data-testid="updates">{importId}</div>,
}))
vi.mock('@/components/decks/DeckAddFact', () => ({ default: () => <div data-testid="add-fact" /> }))
vi.mock('@/components/decks/DeckContributionsOutbox', () => ({ default: () => <div data-testid="outbox" /> }))
vi.mock('@/components/decks/DeckContributionsInbox', () => ({
  default: ({ sourceDeckId }: { sourceDeckId: string }) => <div data-testid="inbox">{sourceDeckId}</div>,
}))

import DeckSharingSheet from '@/components/decks/DeckSharingSheet'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = (over: Record<string, unknown> = {}) => ({ id: 'd1', published_version: 2, ...over }) as unknown as Deck

describe('DeckSharingSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the publish preview for a published deck', async () => {
    actions.getPublishPreviewAction.mockResolvedValueOnce({ success: true, data: { has_unpublished_changes: true } })
    render(<DeckSharingSheet deck={deck()} kind="publish" onClose={vi.fn()} />)
    expect(screen.getByText('publish-deck')).toBeTruthy()
    expect((await screen.findByTestId('publish')).textContent).toBe('{"has_unpublished_changes":true}')
    expect(actions.getPublishPreviewAction).toHaveBeenCalledWith('d1')
  })

  it('publishes a never-published deck without a preview, even if a preview fails', async () => {
    const draft = deck({ published_version: 0 })
    const { unmount } = render(<DeckSharingSheet deck={draft} kind="publish" onClose={vi.fn()} />)
    expect((await screen.findByTestId('publish')).textContent).toBe('null')
    expect(actions.getPublishPreviewAction).not.toHaveBeenCalled()
    unmount()
    actions.getPublishPreviewAction.mockResolvedValueOnce({ success: false, error: 'Preview failed' })
    render(<DeckSharingSheet deck={deck()} kind="publish" onClose={vi.fn()} />)
    // A published deck without its preview shows the error and no Publish button.
    expect((await screen.findByTestId('error')).textContent).toBe('Preview failed')
    expect(screen.queryByTestId('publish')).toBeNull()
  })

  it('shows the updates sheet straight away', () => {
    render(<DeckSharingSheet deck={deck()} kind="updates" onClose={vi.fn()} />)
    expect(screen.getByTestId('updates').textContent).toBe('d1')
  })

  it('falls back to a generic message when the preview fails without one', async () => {
    actions.getPublishPreviewAction.mockResolvedValueOnce({ success: false })
    render(<DeckSharingSheet deck={deck()} kind="publish" onClose={vi.fn()} />)
    expect((await screen.findByTestId('error')).textContent).toBe('load-failed')
  })

  it('shows the add-fact form straight away', () => {
    render(<DeckSharingSheet deck={deck()} kind="add-fact" onClose={vi.fn()} />)
    expect(screen.getByText('add-fact')).toBeTruthy()
    expect(screen.getByTestId('add-fact')).toBeTruthy()
  })

  it('shows the outbox straight away', () => {
    render(<DeckSharingSheet deck={deck()} kind="outbox" onClose={vi.fn()} />)
    expect(screen.getByTestId('outbox')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows the inbox straight away', () => {
    render(<DeckSharingSheet deck={deck()} kind="inbox" onClose={vi.fn()} />)
    expect(screen.getByTestId('inbox').textContent).toBe('d1')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('refreshes the page when closed, and ignores loads that finish after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getPublishPreviewAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const onClose = vi.fn()
    const { unmount } = render(<DeckSharingSheet deck={deck()} kind="publish" onClose={onClose} />)
    fireEvent.click(screen.getByText('keep-open'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('dismiss'))
    expect(onClose).toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
    unmount()
    await act(async () => resolve({ success: true, data: { has_unpublished_changes: true } }))
    expect(screen.queryByTestId('publish')).toBeNull()
  })
})
