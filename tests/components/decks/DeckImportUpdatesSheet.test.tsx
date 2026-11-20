import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  getDeckUpdatesSummaryAction: vi.fn(),
  getDeckUpdateFactAction: vi.fn(),
  syncDeckWithDecisionsAction: vi.fn(),
}))
const toast = vi.hoisted(() => ({ showSuccessToast: vi.fn(), showFailToast: vi.fn() }))

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    (values ? `${key}:${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/ui', () => toast)
vi.mock('@/modules/deck-sharing/deck-sharing.action', () => actions)
// Expose the variant so the selected decision can be checked.
vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, onPress, isDisabled, variant }: {
    children: React.ReactNode, onPress?: () => void, isDisabled?: boolean, variant?: string
  }) => (
    <button type="button" data-variant={variant ?? 'primary'} disabled={!!isDisabled} onClick={onPress}>
      {children}
    </button>
  ),
}))

import DeckImportUpdatesSheet from '@/components/decks/DeckImportUpdatesSheet'

const summary = {
  source_version: 1,
  latest_version: 3,
  added_fact_ids: ['a1'],
  edited_fact_ids: ['e1'],
  removed_fact_ids: ['r1'],
  media_change_count: 2,
  card_template_change_count: 1,
  description_changed: true,
  change_summary: 'Fixed typos',
}
const ok = (data: unknown) => ({ success: true, data })

async function openReview() {
  render(<DeckImportUpdatesSheet importId="i1" />)
  fireEvent.click(await screen.findByText('review-changes'))
}

describe('DeckImportUpdatesSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('summarizes the update like the mobile app', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    render(<DeckImportUpdatesSheet importId="i1" />)
    expect(await screen.findByText('version:{"source":1,"latest":3}')).toBeTruthy()
    expect(screen.getByText('counts:{"added":1,"edited":1,"removed":1,"media":2}')).toBeTruthy()
    expect(screen.getByText('Fixed typos')).toBeTruthy()
    expect(screen.getByText('description-changed')).toBeTruthy()
    expect(screen.getByText('sync-now')).toBeTruthy()

    fireEvent.click(screen.getByText('review-changes'))
    expect(screen.getByText('edited-section:{"count":1}')).toBeTruthy()
    expect(screen.getByText('removed-section:{"count":1}')).toBeTruthy()
    expect(screen.getByText('added-section:{"count":1}')).toBeTruthy()
    expect(screen.getByText('media-section:{"count":2}')).toBeTruthy()
    expect(screen.getByText('templates-section:{"count":1}')).toBeTruthy()
    fireEvent.click(screen.getByText('hide-review'))
    expect(screen.queryByText('edited-section:{"count":1}')).toBeNull()
  })

  it('shows an up-to-date deck without review or sync', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok({ source_version: 2, latest_version: 2 }))
    render(<DeckImportUpdatesSheet importId="i1" />)
    const button = await screen.findByText('up-to-date')
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('review-changes')).toBeNull()
    expect(screen.getByText('counts:{"added":0,"edited":0,"removed":0,"media":0}')).toBeTruthy()
  })

  it('flags a version bump alone as an update', async () => {
    const mediaOnly = { source_version: 1, latest_version: 2, media_change_count: 3 }
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(mediaOnly))
    render(<DeckImportUpdatesSheet importId="i1" />)
    expect(await screen.findByText('sync-now')).toBeTruthy()
    // Only media changed, so there are no facts to review.
    expect(screen.queryByText('review-changes')).toBeNull()
  })

  it('shows before/after for an edited fact and syncs the chosen decisions', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction.mockResolvedValue(ok({
      fact_id: 'e1', kind: 'edited', aligned: true, has_local_overlay: true,
      before: { entries: [{ text: 'hola' }, { text: '' }] }, after: { entries: [{ text: 'hola!' }] },
    }))
    actions.syncDeckWithDecisionsAction.mockResolvedValue({ success: true })
    await openReview()

    await act(async () => fireEvent.click(screen.getByText('e1')))
    expect(actions.getDeckUpdateFactAction).toHaveBeenCalledWith('i1', 'e1')
    expect(screen.getByText('aligned · local-overlay')).toBeTruthy()
    expect(screen.getByText('before: hola')).toBeTruthy()
    expect(screen.getByText('after: hola!')).toBeTruthy()
    fireEvent.click(screen.getByText('keep-local'))

    await act(async () => fireEvent.click(screen.getByText('sync-now')))
    // Only the fact the user decided is sent; the server applies its defaults to the rest.
    expect(actions.syncDeckWithDecisionsAction).toHaveBeenCalledWith('i1', 3, [{ fact_id: 'e1', action: 'keep' }])
    expect(toast.showSuccessToast).toHaveBeenCalledWith('sync-success')
    expect(screen.getByText('version:{"source":3,"latest":3}')).toBeTruthy()
    expect(screen.getByText('up-to-date')).toBeTruthy()
  })

  it('shows the server default for an undecided fact and leaves it to the server on sync', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction
      .mockResolvedValue(ok({ fact_id: 'r1', kind: 'removed', default_action: 'keep', fact: null }))
    actions.syncDeckWithDecisionsAction.mockResolvedValue({ success: true })
    await openReview()
    await act(async () => fireEvent.click(screen.getByText('r1')))
    expect(screen.getByText('before: —')).toBeTruthy()
    // The server will keep the learner's copy, so Reject shows as selected.
    expect(screen.getByText('keep-local').getAttribute('data-variant')).toBe('primary')
    expect(screen.getByText('accept').getAttribute('data-variant')).toBe('secondary')
    await act(async () => fireEvent.click(screen.getByText('sync-now')))
    expect(actions.syncDeckWithDecisionsAction.mock.calls[0][2]).toEqual([])
  })

  it('shows an added fact without decisions, and collapses it', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction
      .mockResolvedValue(ok({ fact_id: 'a1', kind: 'added', fact: { entries: [{ text: 'adiós' }] } }))
    await openReview()
    await act(async () => fireEvent.click(screen.getByText('a1')))
    expect(screen.getByText('after: adiós')).toBeTruthy()
    expect(screen.queryByText('keep-local')).toBeNull()
    fireEvent.click(screen.getByText('a1'))
    expect(screen.queryByText('after: adiós')).toBeNull()
    fireEvent.click(screen.getByText('a1'))
    expect(screen.getByText('after: adiós')).toBeTruthy()
    expect(actions.getDeckUpdateFactAction).toHaveBeenCalledTimes(1)
  })

  it('offers a retry when a fact fails to load', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction
      .mockResolvedValueOnce({ success: false, error: 'Not found' })
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(ok({ fact_id: 'e1', kind: 'edited', before: null, after: null }))
    await openReview()
    await act(async () => fireEvent.click(screen.getByText('e1')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Not found')
    await act(async () => fireEvent.click(screen.getByText('e1')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('load-failed')
    await act(async () => fireEvent.click(screen.getByText('retry')))
    expect(screen.getByText('before: —')).toBeTruthy()
  })

  it('reports sync failures, with a fallback message', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.syncDeckWithDecisionsAction
      .mockResolvedValueOnce({ success: false, error: 'Conflict' })
      .mockResolvedValueOnce({ success: false })
    render(<DeckImportUpdatesSheet importId="i1" />)
    const sync = await screen.findByText('sync-now')
    await act(async () => fireEvent.click(sync))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Conflict')
    await act(async () => fireEvent.click(screen.getByText('sync-now')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('sync-failed')
  })

  it('shows load errors and retries', async () => {
    actions.getDeckUpdatesSummaryAction
      .mockResolvedValueOnce({ success: false, error: 'Not an import' })
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(ok({ source_version: 1, latest_version: 1 }))
    render(<DeckImportUpdatesSheet importId="i1" />)
    expect(await screen.findByText('Not an import')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('retry')))
    expect(await screen.findByText('load-failed')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('retry')))
    expect(await screen.findByText('up-to-date')).toBeTruthy()
  })

  it('ignores a summary that arrives after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getDeckUpdatesSummaryAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { unmount } = render(<DeckImportUpdatesSheet importId="i1" />)
    unmount()
    await act(async () => resolve(ok(summary)))
    expect(screen.queryByText('sync-now')).toBeNull()
  })

  it('shows Reject as the default for an edited fact the learner changed, as the server will keep it', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction.mockResolvedValue(ok({
      fact_id: 'e1', kind: 'edited', has_local_overlay: true, aligned: false, before: null, after: null,
    }))
    await openReview()
    await act(async () => fireEvent.click(screen.getByText('e1')))
    expect(screen.getByText('keep-local').getAttribute('data-variant')).toBe('primary')
  })

  it('lets the learner take the author\'s version of an added fact they already have', async () => {
    actions.getDeckUpdatesSummaryAction.mockResolvedValue(ok(summary))
    actions.getDeckUpdateFactAction.mockResolvedValue(ok({
      fact_id: 'a1', kind: 'added', has_local_overlay: true, aligned: false, fact: { entries: [{ text: 'x' }] },
    }))
    actions.syncDeckWithDecisionsAction.mockResolvedValue({ success: true })
    await openReview()
    await act(async () => fireEvent.click(screen.getByText('a1')))
    fireEvent.click(screen.getByText('accept'))
    await act(async () => fireEvent.click(screen.getByText('sync-now')))
    expect(actions.syncDeckWithDecisionsAction.mock.calls[0][2]).toEqual([{ fact_id: 'a1', action: 'accept' }])
  })
})
