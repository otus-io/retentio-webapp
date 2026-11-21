import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  getOpenContributionsAction: vi.fn(),
  acceptContributionAction: vi.fn(),
  updateContributionStatusAction: vi.fn(),
}))
const toast = vi.hoisted(() => ({ showSuccessToast: vi.fn(), showFailToast: vi.fn() }))

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    (values ? `${key}:${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/ui', () => toast)
vi.mock('@/modules/contributions/contributions.action', () => actions)
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))

import DeckContributionsInbox from '@/components/decks/DeckContributionsInbox'

const edit = {
  id: 'c1', type: 'fact_edit', reporter: 'ada', fact_id: 'f1', source_version: 2, message: 'typo',
  reported_fact: { id: 'f1', entries: [{ text: 'hola' }, { text: ' ' }] },
  proposed_entries: [{ text: 'hola!' }],
}
const add = { id: 'c2', type: 'fact_add', reporter: 'bo', source_version: 0, proposed_entries: [{ text: 'adiós' }] }
const report = { id: 'c3', type: 'report', reporter: 'cy', source_version: 1, reported_fact: { id: 'f2', entries: [] } }
const meta = {
  id: 'c4', type: 'field_rename', reporter: 'di', source_version: 1,
  reported_fields: ['Word'], proposed_fields: [], add_tags: ['noun'], remove_tags: ['old'], reported_tags: ['x'],
}
const page = (contributions: unknown[], hasMore = false) => ({ success: true, data: { contributions, hasMore } })

describe('DeckContributionsInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows open contributions as cards with their changes', async () => {
    actions.getOpenContributionsAction.mockResolvedValue(page([edit, add, report, meta]))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    expect(await screen.findByText('types.fact_edit')).toBeTruthy()
    expect(screen.getByText('ada · f1 · v2')).toBeTruthy()
    expect(screen.getByText('typo')).toBeTruthy()
    expect(screen.getByText('hola')).toBeTruthy()
    expect(screen.getByText('hola!')).toBeTruthy()
    expect(screen.getByText('proposed')).toBeTruthy()
    expect(screen.getByText('adiós')).toBeTruthy()
    expect(screen.getByText('bo')).toBeTruthy()
    expect(screen.getByText('Word → —')).toBeTruthy()
    expect(screen.getByText('before: x')).toBeTruthy()
    expect(screen.getByText('+ noun')).toBeTruthy()
    expect(screen.getByText('− old')).toBeTruthy()
    // Reports can only be dismissed or resolved; three of the four cards can be accepted.
    expect(screen.getAllByText('accept')).toHaveLength(3)
    expect(screen.getByText('accept-all:{"count":3}')).toBeTruthy()
    expect(actions.getOpenContributionsAction).toHaveBeenCalledWith('s1')
  })

  it('shows reported entries, and skips the diff when there is nothing to compare', async () => {
    const reported = { ...report, reported_fact: { id: 'f2', entries: [{ text: 'wrong' }] } }
    const bare = { id: 'c5', type: 'template_add', reporter: 'ed', source_version: 0 }
    actions.getOpenContributionsAction.mockResolvedValue(page([reported, bare]))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    expect(await screen.findByText('reported')).toBeTruthy()
    expect(screen.getByText('wrong')).toBeTruthy()
    expect(screen.getByText('types.template_add')).toBeTruthy()
  })

  it('accepts, dismisses and resolves contributions, removing each in place', async () => {
    const second = { ...edit, id: 'c8' }
    const third = { ...edit, id: 'c9' }
    actions.getOpenContributionsAction.mockResolvedValue(page([edit, second, third]))
    actions.acceptContributionAction.mockResolvedValue({ success: true })
    actions.updateContributionStatusAction.mockResolvedValue({ success: true })
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findAllByText('types.fact_edit')

    await act(async () => fireEvent.click(screen.getAllByText('accept')[0]))
    expect(actions.acceptContributionAction)
      .toHaveBeenCalledWith({ sourceDeckId: 's1', contributionId: 'c1' }, null, expect.any(FormData))
    // The handled card leaves the list in place, without reloading (which would drop loaded pages).
    expect(screen.getAllByText('types.fact_edit')).toHaveLength(2)
    expect(toast.showSuccessToast).toHaveBeenLastCalledWith('accepted')

    await act(async () => fireEvent.click(screen.getAllByText('dismiss')[0]))
    expect(actions.updateContributionStatusAction).toHaveBeenLastCalledWith(
      { sourceDeckId: 's1', contributionId: 'c8', data: { status: 'dismissed' } }, null, expect.any(FormData),
    )
    await act(async () => fireEvent.click(screen.getByText('resolve')))
    expect(actions.updateContributionStatusAction.mock.lastCall?.[0].data).toEqual({ status: 'resolved' })
    expect(toast.showSuccessToast).toHaveBeenLastCalledWith('updated')
    expect(screen.getByText('empty')).toBeTruthy()
    expect(actions.getOpenContributionsAction).toHaveBeenCalledTimes(1)
  })

  it('fetches more when every loaded contribution has been handled', async () => {
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockResolvedValueOnce(page([add]))
    actions.updateContributionStatusAction.mockResolvedValue({ success: true })
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findByText('types.fact_edit')
    let next!: (v: unknown) => void
    actions.getOpenContributionsAction.mockReset().mockReturnValueOnce(new Promise((r) => { next = r }))
    await act(async () => fireEvent.click(screen.getByText('dismiss')))
    // A spinner, not the empty state, while the next page loads.
    expect(screen.queryByText('empty')).toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
    await act(async () => next(page([add])))
    expect(await screen.findByText('types.fact_add')).toBeTruthy()
  })

  it('locks card actions while more contributions load', async () => {
    let more!: (v: unknown) => void
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockReturnValueOnce(new Promise((r) => { more = r }))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findByText('types.fact_edit')
    act(() => { fireEvent.click(screen.getByText('load-more')) })
    await waitFor(() => expect((screen.getByText('dismiss') as HTMLButtonElement).disabled).toBe(true))
    await act(async () => more(page([add])))
    expect(screen.queryByText('load-more')).toBeNull()
  })

  it('reports failed actions, with a fallback message', async () => {
    actions.getOpenContributionsAction.mockResolvedValue(page([edit]))
    actions.acceptContributionAction
      .mockResolvedValueOnce({ success: false, error: 'Conflict' })
      .mockResolvedValueOnce(undefined)
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findByText('types.fact_edit')
    await act(async () => fireEvent.click(screen.getByText('accept')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Conflict')
    await act(async () => fireEvent.click(screen.getByText('accept')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('operation-failed')
  })

  it('accepts all after confirming, reporting full, partial and failed runs', async () => {
    actions.getOpenContributionsAction.mockResolvedValue(page([edit, add, report]))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findByText('accept-all:{"count":2}')

    fireEvent.click(screen.getByText('accept-all:{"count":2}'))
    expect(screen.getByText('accept-all-confirm-message:{"count":2}')).toBeTruthy()
    actions.acceptContributionAction.mockResolvedValue({ success: true })
    await act(async () => fireEvent.click(screen.getAllByText('accept').at(-1)!))
    expect(actions.acceptContributionAction).toHaveBeenCalledTimes(2)
    expect(toast.showSuccessToast).toHaveBeenLastCalledWith('accept-all-success:{"count":2}')

    fireEvent.click(await screen.findByText('accept-all:{"count":2}'))
    actions.acceptContributionAction
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'x' })
    await act(async () => fireEvent.click(screen.getAllByText('accept').at(-1)!))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('accept-all-partial:{"sent":1,"failed":1}')

    fireEvent.click(await screen.findByText('accept-all:{"count":2}'))
    actions.acceptContributionAction
      .mockResolvedValueOnce({ success: false, error: 'Gone' })
      .mockResolvedValueOnce({ success: false })
    await act(async () => fireEvent.click(screen.getAllByText('accept').at(-1)!))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('operation-failed')

    fireEvent.click(await screen.findByText('accept-all:{"count":2}'))
    actions.acceptContributionAction.mockResolvedValue({ success: false, error: 'Gone' })
    await act(async () => fireEvent.click(screen.getAllByText('accept').at(-1)!))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Gone')
  })

  it('loads every open page before accepting all, then clears the list while it reloads', async () => {
    let reload!: (v: unknown) => void
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockResolvedValueOnce(page([add], true))
      .mockResolvedValueOnce(page([meta]))
      .mockReturnValueOnce(new Promise((r) => { reload = r }))
    actions.acceptContributionAction.mockResolvedValue({ success: true })
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    // With more pages on the server the count is a lower bound.
    const acceptAllButton = await screen.findByText('accept-all:{"count":"1+"}')
    await act(async () => fireEvent.click(acceptAllButton))
    expect(actions.getOpenContributionsAction).toHaveBeenNthCalledWith(2, 's1', 1)
    expect(actions.getOpenContributionsAction).toHaveBeenNthCalledWith(3, 's1', 2)
    expect(screen.getByText('accept-all-confirm-message:{"count":3}')).toBeTruthy()

    await act(async () => fireEvent.click(screen.getAllByText('accept').at(-1)!))
    expect(actions.acceptContributionAction).toHaveBeenCalledTimes(3)
    expect(screen.queryByText('types.fact_edit')).toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
    await act(async () => reload(page([])))
    expect(screen.getByText('empty')).toBeTruthy()
  })

  it('keeps loaded pages when one fails, and retries from there', async () => {
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockResolvedValueOnce(page([add], true))
      .mockResolvedValueOnce({ success: false, error: 'Timeout' })
      .mockResolvedValueOnce({ success: false })
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    const acceptAllButton = await screen.findByText('accept-all:{"count":"1+"}')
    await act(async () => fireEvent.click(acceptAllButton))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Timeout')
    expect(screen.queryByText(/accept-all-confirm-message/)).toBeNull()
    // The second page stayed loaded, so the retry continues after it.
    expect(screen.getByText('types.fact_add')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('accept-all:{"count":"2+"}')))
    expect(actions.getOpenContributionsAction).toHaveBeenLastCalledWith('s1', 2)
    expect(toast.showFailToast).toHaveBeenLastCalledWith('load-failed')
  })

  it('stops paging on an empty page and skips repeated contributions', async () => {
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockResolvedValueOnce(page([edit, add], true))
      .mockResolvedValueOnce(page([], true))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    const acceptAllButton = await screen.findByText('accept-all:{"count":"1+"}')
    await act(async () => fireEvent.click(acceptAllButton))
    expect(actions.getOpenContributionsAction).toHaveBeenCalledTimes(3)
    expect(screen.getByText('accept-all-confirm-message:{"count":2}')).toBeTruthy()
    expect(screen.getAllByText('types.fact_edit')).toHaveLength(1)
  })

  it('drops an accept-all walk after the inbox closes', async () => {
    let more!: (v: unknown) => void
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockReturnValueOnce(new Promise((r) => { more = r }))
    const { unmount } = render(<DeckContributionsInbox sourceDeckId="s1" />)
    const acceptAllButton = await screen.findByText('accept-all:{"count":"1+"}')
    act(() => { fireEvent.click(acceptAllButton) })
    unmount()
    await act(async () => more(page([add])))
    expect(screen.queryByText(/accept-all-confirm-message/)).toBeNull()
  })

  it('shows progress while accepting all', async () => {
    actions.getOpenContributionsAction.mockResolvedValue(page([edit]))
    let resolve!: (v: unknown) => void
    actions.acceptContributionAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    fireEvent.click(await screen.findByText('accept-all:{"count":1}'))
    act(() => { fireEvent.click(screen.getAllByText('accept').at(-1)!) })
    expect(await screen.findByText('accept-all-progress:{"done":0,"total":1}')).toBeTruthy()
    await act(async () => resolve({ success: true }))
  })

  it('loads more pages', async () => {
    actions.getOpenContributionsAction
      .mockResolvedValueOnce(page([edit], true))
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(page([add]))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    await screen.findByText('types.fact_edit')
    await act(async () => fireEvent.click(screen.getByText('load-more')))
    expect(screen.queryByText('types.fact_add')).toBeNull()
    expect(toast.showFailToast).toHaveBeenLastCalledWith('load-failed')
    await act(async () => fireEvent.click(screen.getByText('load-more')))
    expect(actions.getOpenContributionsAction).toHaveBeenLastCalledWith('s1', 1)
    expect(screen.getByText('types.fact_add')).toBeTruthy()
    expect(screen.queryByText('load-more')).toBeNull()
  })

  it('shows the empty state, load errors and retries', async () => {
    actions.getOpenContributionsAction
      .mockResolvedValueOnce({ success: false, error: 'Forbidden' })
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(page([]))
    render(<DeckContributionsInbox sourceDeckId="s1" />)
    expect(await screen.findByText('Forbidden')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('retry')))
    expect(await screen.findByText('load-failed')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('retry')))
    expect(await screen.findByText('empty')).toBeTruthy()
  })

  it('ignores a load that finishes after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getOpenContributionsAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { unmount } = render(<DeckContributionsInbox sourceDeckId="s1" />)
    unmount()
    await act(async () => resolve(page([edit])))
    expect(screen.queryByText('types.fact_edit')).toBeNull()
  })
})
