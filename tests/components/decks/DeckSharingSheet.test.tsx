import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
const actions = vi.hoisted(() => ({
  getPublishPreviewAction: vi.fn(),
  getDeckImportUpdatesAction: vi.fn(),
  getContributionsAction: vi.fn(),
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
  getDeckImportUpdatesAction: actions.getDeckImportUpdatesAction,
}))
vi.mock('@/modules/contributions/contributions.action', () => ({
  getContributionsAction: actions.getContributionsAction,
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/decks/DeckPublishPanel', () => ({
  default: ({ preview }: { preview: unknown }) => <div data-testid="publish">{JSON.stringify(preview)}</div>,
}))
vi.mock('@/components/decks/DeckImportUpdatesPanel', () => ({
  default: ({ updates, onSynced }: { updates: { latest_version: number }, onSynced: () => void }) => (
    <div data-testid="updates">
      v{updates.latest_version}
      <button type="button" onClick={onSynced}>synced</button>
    </div>
  ),
}))
vi.mock('@/components/decks/DeckContributionsPanel', () => ({ default: () => <div data-testid="outbox" /> }))
vi.mock('@/components/decks/DeckAuthorContributionsPanel', () => ({
  default: (p: {
    selectedTab: string, total: number, loadFailed: boolean, onSelectTab: (t: string) => void, onChanged: () => void,
  }) => (
    <div data-testid="inbox">
      {`${p.selectedTab}:${p.total}:${p.loadFailed}`}
      <button type="button" onClick={() => p.onSelectTab('all')}>tab-all</button>
      <button type="button" onClick={p.onChanged}>changed</button>
    </div>
  ),
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
    expect((await screen.findByTestId('publish')).textContent).toBe('null')
    expect(screen.getByTestId('error').textContent).toBe('Preview failed')
  })

  it('loads updates and reloads them after a sync', async () => {
    actions.getDeckImportUpdatesAction
      .mockResolvedValueOnce({ success: true, data: { latest_version: 2 } })
      .mockResolvedValueOnce({ success: true, data: { latest_version: 3 } })
    render(<DeckSharingSheet deck={deck()} kind="updates" onClose={vi.fn()} />)
    expect((await screen.findByTestId('updates')).textContent).toContain('v2')
    fireEvent.click(screen.getByText('synced'))
    await waitFor(() => expect(screen.getByTestId('updates').textContent).toContain('v3'))
  })

  it('shows update load errors, with a fallback message', async () => {
    actions.getDeckImportUpdatesAction.mockResolvedValueOnce({ success: false, error: 'Not an import' })
    const { unmount } = render(<DeckSharingSheet deck={deck()} kind="updates" onClose={vi.fn()} />)
    expect((await screen.findByTestId('error')).textContent).toBe('Not an import')
    expect(screen.queryByTestId('updates')).toBeNull()
    unmount()
    actions.getDeckImportUpdatesAction.mockResolvedValueOnce({ success: false })
    render(<DeckSharingSheet deck={deck()} kind="updates" onClose={vi.fn()} />)
    expect((await screen.findByTestId('error')).textContent).toBe('load-failed')
  })

  it('shows the outbox straight away', () => {
    render(<DeckSharingSheet deck={deck()} kind="outbox" onClose={vi.fn()} />)
    expect(screen.getByTestId('outbox')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('loads inbox tabs locally and reloads after changes', async () => {
    actions.getContributionsAction
      .mockResolvedValueOnce({ success: true, data: { contributions: [], total: 4 } })
      .mockResolvedValueOnce({ success: false, error: 'x' })
      .mockResolvedValueOnce({ success: true, data: { contributions: [], total: 9 } })
    render(<DeckSharingSheet deck={deck()} kind="inbox" onClose={vi.fn()} />)
    expect((await screen.findByTestId('inbox')).textContent).toContain('open:4:false')
    expect(actions.getContributionsAction).toHaveBeenLastCalledWith('d1', 'open')
    fireEvent.click(screen.getByText('tab-all'))
    // The old tab's list is replaced by a spinner until the new tab loads.
    expect(screen.queryByTestId('inbox')).toBeNull()
    await waitFor(() => expect(screen.getByTestId('inbox').textContent).toContain('all:0:true'))
    expect(actions.getContributionsAction).toHaveBeenLastCalledWith('d1', undefined)
    fireEvent.click(screen.getByText('changed'))
    await waitFor(() => expect(screen.getByTestId('inbox').textContent).toContain('all:9:false'))
  })

  it('refreshes the page when closed, and ignores loads that finish after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getDeckImportUpdatesAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const onClose = vi.fn()
    const { unmount } = render(<DeckSharingSheet deck={deck()} kind="updates" onClose={onClose} />)
    fireEvent.click(screen.getByText('keep-open'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('dismiss'))
    expect(onClose).toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
    unmount()
    await act(async () => resolve({ success: true, data: { latest_version: 5 } }))
    expect(screen.queryByTestId('updates')).toBeNull()
  })
})
