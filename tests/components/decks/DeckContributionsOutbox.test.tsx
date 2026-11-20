import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitDeckContributionsBatchAction = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ showSuccessToast: vi.fn(), showFailToast: vi.fn() }))

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    (values ? `${key}:${JSON.stringify(values)}` : key),
}))
vi.mock('@/lib/ui', () => toast)
vi.mock('@/modules/contributions/contributions.action', () => ({ submitDeckContributionsBatchAction }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppInput', () => ({
  default: (p: { placeholder: string, value: string, onChange: (v: string) => void }) => (
    <input placeholder={p.placeholder} value={p.value} onChange={(e) => p.onChange(e.target.value)} />
  ),
}))
vi.mock('@/components/decks/DeckContributionsPanel', () => ({
  ContributionFormModal: (
    { kind, onSave, onClose }: { kind: string, onSave: (c: unknown) => void, onClose: () => void },
  ) => (
    <div data-testid="form">
      {kind}
      <button
        type="button"
        onClick={() => onSave({
          id: 'field_rename',
          kind: 'field_rename',
          preview: 'Word → Term',
          proposedFields: ['Term'],
          savedAt: '2026-01-01T00:00:00Z',
        })}
      >
        save-form
      </button>
      <button type="button" onClick={onClose}>close-form</button>
    </div>
  ),
}))

import DeckContributionsOutbox from '@/components/decks/DeckContributionsOutbox'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'i1', fields: ['Word'] } as unknown as Deck
const tags = {
  id: 'deck_tags',
  kind: 'deck_tags',
  preview: '+noun',
  addTags: ['noun'],
  removeTags: [],
  savedAt: '2026-01-01T00:00:00Z',
}
const rename = {
  id: 'field_rename',
  kind: 'field_rename',
  preview: 'Word → Term',
  proposedFields: ['Term'],
  savedAt: '2026-01-02T00:00:00Z',
}
const sentItem = {
  id: 'deck_tags:deck:1',
  kind: 'deck_tags',
  preview: '+old',
  contributionId: 'c0',
  sentAt: '2026-01-01T00:00:00Z',
}

function seed(pending: unknown[], sent: unknown[] = []) {
  localStorage.setItem('retentio_pending_contribs_v2:i1', JSON.stringify(pending))
  localStorage.setItem('retentio_sent_contribs_v1:i1', JSON.stringify(sent))
}
const stored = (key: string) => JSON.parse(localStorage.getItem(`${key}:i1`) ?? '[]')

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    clear: () => map.clear(),
  }
}

describe('DeckContributionsOutbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('lists pending items, selects them and sends them with the message', async () => {
    seed([tags, rename], [sentItem])
    submitDeckContributionsBatchAction.mockResolvedValue({
      success: true,
      data: { submitted: [{ localId: 'deck_tags', kind: 'deck_tags', contributionId: 'c1' }], failed: [] },
    })
    render(<DeckContributionsOutbox deck={deck} />)
    expect(await screen.findByText('tab-pending:{"count":2}')).toBeTruthy()
    expect(screen.getByText('tab-sent:{"count":1}')).toBeTruthy()
    expect(screen.getByText('+noun')).toBeTruthy()
    expect((screen.getByText('send-selected') as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByText('+noun').closest('label')!.querySelector('input')!)
    fireEvent.change(screen.getByPlaceholderText('message-hint'), { target: { value: 'Thanks' } })
    await act(async () => fireEvent.click(screen.getByText('send-selected-count:{"count":1}')))
    const [payload] = submitDeckContributionsBatchAction.mock.calls[0]
    expect(payload).toEqual({ importDeckId: 'i1', contributions: [tags], message: 'Thanks' })
    expect(toast.showSuccessToast).toHaveBeenCalledWith('batch-submit-success:{"count":1}')
    expect(stored('retentio_pending_contribs_v2')).toEqual([rename])
    expect(stored('retentio_sent_contribs_v1')).toHaveLength(2)
    expect((screen.getByPlaceholderText('message-hint') as HTMLInputElement).value).toBe('')
  })

  it('selects all, dismisses the selection and clears everything', async () => {
    seed([tags, rename])
    render(<DeckContributionsOutbox deck={deck} />)
    const selectAll = (await screen.findByText('select-all:{"count":2}')).closest('label')!.querySelector('input')!
    fireEvent.click(selectAll)
    expect(screen.getByText('send-selected-count:{"count":2}')).toBeTruthy()
    fireEvent.click(selectAll)
    expect(screen.getByText('send-selected')).toBeTruthy()

    fireEvent.click(screen.getByText('Word → Term').closest('label')!.querySelector('input')!)
    fireEvent.click(screen.getByText('dismiss-selected'))
    expect(screen.getByText('dismissed:{"count":1}')).toBeTruthy()
    expect(stored('retentio_pending_contribs_v2')).toEqual([tags])

    fireEvent.click(screen.getByText('+noun').closest('label')!.querySelector('input')!)
    fireEvent.click(screen.getByText('+noun').closest('label')!.querySelector('input')!)
    fireEvent.click(screen.getByText('clear-all'))
    expect(screen.getByText('cleared:{"count":1}')).toBeTruthy()
    expect(screen.getByText('empty')).toBeTruthy()
  })

  it('reports failures, including the verify-email requirement', async () => {
    seed([tags])
    submitDeckContributionsBatchAction
      .mockResolvedValueOnce({
        success: true,
        data: {
          submitted: [],
          failed: [
            { localId: 'deck_tags', error: 'x', code: 'email_not_verified' },
            { localId: 'deck_tags', error: 'y' },
          ],
        },
      })
      .mockResolvedValueOnce({ success: false, error: 'Offline' })
      .mockResolvedValueOnce(undefined)
    render(<DeckContributionsOutbox deck={deck} />)
    fireEvent.click((await screen.findByText('+noun')).closest('label')!.querySelector('input')!)
    await act(async () => fireEvent.click(screen.getByText('send-selected-count:{"count":1}')))
    expect(toast.showFailToast).toHaveBeenCalledWith('emailNotVerifiedError')
    expect(toast.showFailToast).toHaveBeenCalledWith('batch-submit-failed:{"count":1}')
    expect(stored('retentio_pending_contribs_v2')).toEqual([tags])
    await act(async () => fireEvent.click(screen.getByText('send-selected-count:{"count":1}')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('Offline')
    await act(async () => fireEvent.click(screen.getByText('send-selected-count:{"count":1}')))
    expect(toast.showFailToast).toHaveBeenLastCalledWith('submit-failed')
  })

  it('shows sent items and empty states', async () => {
    seed([], [sentItem])
    render(<DeckContributionsOutbox deck={deck} />)
    fireEvent.click(await screen.findByText('tab-sent:{"count":1}'))
    expect(screen.queryByText('empty')).toBeNull()
    await waitFor(() => expect(screen.getByText('+old')).toBeTruthy())
  })

  it('shows an empty sent list', async () => {
    render(<DeckContributionsOutbox deck={deck} />)
    fireEvent.click(await screen.findByText('tab-sent:{"count":0}'))
    expect(screen.getByText('sent-empty')).toBeTruthy()
  })

  it('proposes a field rename or deck tags from the sheet', async () => {
    const { container } = render(<DeckContributionsOutbox deck={deck} />)
    // The shared button mock drops aria-label, so find the icon buttons by their icons.
    const iconButton = (icon: string) => container.querySelector(`.lucide-${icon}`)!.closest('button')!
    await screen.findByText('empty')
    fireEvent.click(iconButton('tags'))
    expect(screen.getByTestId('form').textContent).toContain('deck_tags')
    fireEvent.click(screen.getByText('close-form'))
    expect(screen.queryByTestId('form')).toBeNull()

    fireEvent.click(screen.getByText('tab-sent:{"count":0}'))
    fireEvent.click(iconButton('pencil-line'))
    fireEvent.click(screen.getByText('save-form'))
    expect(screen.getByText('Word → Term')).toBeTruthy()
    expect(stored('retentio_pending_contribs_v2')).toHaveLength(1)
  })
})
