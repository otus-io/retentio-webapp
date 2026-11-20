import { act, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  getNextCardAction: vi.fn(),
  reviewCardAction: vi.fn(),
  hideCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
}))
const push = vi.fn()
const submitReport = vi.fn()
const toast = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key,
  useFormatter: () => ({ number: (v: number, o: { unit: string }) => `${v} ${o.unit}` }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/modules/cards/cards.action', () => actions)
vi.mock('@/modules/contributions/contributions.action', () => ({
  submitReportContributionAction: (...a: unknown[]) => submitReport(...a),
}))
vi.mock('@/lib/ui', () => ({ showSuccessToast: (m: string) => toast(m) }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppSelect', async () => ({ default: (await import('../../helpers/heroui')).AppSelectMock }))
vi.mock('@/components/app/AppTextarea', () => ({
  default: ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('@/components/facts/FactsAudioPlayButton', () => ({
  default: ({ mediaId }: { mediaId: string }) => <button type="button" data-testid="audio">{mediaId}</button>,
}))
vi.mock('@/components/study/StudyEditFactModal', () => ({
  default: (
    { factId, onSaved, setIsOpen }: { factId: string, onSaved: () => void, setIsOpen: (v: boolean) => void },
  ) => (
    <div data-testid="edit-fact-modal">
      {factId}
      <button type="button" onClick={() => { setIsOpen(false); onSaved() }}>save-fact</button>
    </div>
  ),
}))
vi.mock('@/components/study/StudyCardMedia', () => ({
  default: ({ kind, url }: { kind: string, url: string }) => <span data-testid={kind}>{url}</span>,
}))

import StudySession from '@/components/study/StudySession'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = {
  id: 'd1',
  name: 'Spanish',
  fields: ['Word', 'Meaning'],
} as unknown as Deck
const tags = [{ id: 't1', name: 'verbs', description: '' }] as never

const now = 1_700_000_000
const card = {
  id: 'c1',
  fact_id: 'f1',
  template: [[0], [1]],
  last_review: now - 2000,
  due_date: now - 1000,
  hidden: false,
  created_at: 0,
  front: [{ field: 'Word', text: 'hola', audio: 'https://x/api/media/a1?v=2' }],
  back: [{ text: 'hello', image: 'https://x/api/media/i1' }, { video: 'https://x/api/media/v1' }, { image: 'https://x/api/media/i2' }],
}

function withCard(c: unknown = card, stats: unknown = { due_cards: 5 }) {
  return { success: true, data: { card: c ? { card: c } : {}, stats } }
}


configure({ asyncUtilTimeout: 5000 })

async function clickWhenEnabled(text: string) {
  const el = await screen.findByText(text)
  await waitFor(() => expect((screen.getByText(text) as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(screen.getByText(text))
  return el
}

describe('StudySession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(now * 1000)
  })

  it('shows the front, reveals the back and submits the chosen interval', async () => {
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValueOnce(withCard(null))
    actions.reviewCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)

    expect(await screen.findByText('hola')).toBeTruthy()
    expect(screen.getByTestId('audio').textContent).toBe('a1')
    expect(screen.queryByText('hello')).toBeNull()
    expect(screen.getByText('due-progress:{"cleared":0,"target":5,"percent":"0%"}')).toBeTruthy()

    await clickWhenEnabled('show-answer')
    expect(screen.getByText('hello')).toBeTruthy()
    expect(screen.getAllByTestId('image')).toHaveLength(2)
    expect(screen.getByTestId('video')).toBeTruthy()

    // overdue, interval 1000 → default 2000s, range 500..4000
    const slider = screen.getByLabelText('next-review') as HTMLInputElement
    expect(slider.value).toBe('2000')
    expect(screen.getByText('8.3 minute')).toBeTruthy()
    expect(screen.getByText('1.1 hour')).toBeTruthy()
    fireEvent.change(slider, { target: { value: '3000' } })

    await clickWhenEnabled('next')
    await waitFor(() => expect(actions.reviewCardAction).toHaveBeenCalledWith({ deckId: 'd1', cardId: 'c1', interval: 3000 }))
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(screen.getByText('due-progress:{"cleared":1,"target":5,"percent":"20%"}')).toBeTruthy()
  })

  it('filters by tag and reloads when caught up', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard(null, null))
    render(<StudySession deck={deck} tags={tags} />)
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(actions.getNextCardAction).toHaveBeenLastCalledWith('d1', undefined)
    expect(screen.queryByText('todays-due')).toBeNull()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    await waitFor(() => expect(actions.getNextCardAction).toHaveBeenLastCalledWith('d1', 't1'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    await waitFor(() => expect(actions.getNextCardAction).toHaveBeenLastCalledWith('d1', undefined))

    await waitFor(() => expect((screen.getByText('reload') as HTMLButtonElement).disabled).toBe(false))
    const calls = actions.getNextCardAction.mock.calls.length
    await clickWhenEnabled('reload')
    await waitFor(() => expect(actions.getNextCardAction.mock.calls.length).toBe(calls + 1))
  })

  it('hides the tag filter for decks without tags and shows load errors', async () => {
    actions.getNextCardAction.mockResolvedValue({ success: false, error: 'Deck not found' })
    render(<StudySession deck={deck} tags={[]} />)
    expect(await screen.findByTestId('error')).toBeTruthy()
    expect(screen.getByTestId('error').textContent).toBe('Deck not found')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('shows an empty error string when the action gives none', async () => {
    actions.getNextCardAction.mockResolvedValue({ success: false })
    render(<StudySession deck={deck} tags={tags} />)
    await waitFor(() => expect(actions.getNextCardAction).toHaveBeenCalled())
    expect(screen.queryByText('hola')).toBeNull()
  })

  it('hides a card without counting it as studied', async () => {
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValue(withCard(null))
    actions.hideCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('hide-card'))
    await waitFor(() => expect(actions.hideCardAction).toHaveBeenCalledWith({ deckId: 'd1', cardId: 'c1' }))
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(screen.getByText('due-progress:{"cleared":0,"target":5,"percent":"0%"}')).toBeTruthy()
  })

  it('reports a failed mutation and keeps the card', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    actions.hideCardAction.mockResolvedValueOnce({ success: false, error: 'nope' }).mockResolvedValueOnce({ success: false })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('hide-card'))
    expect((await screen.findByTestId('error')).textContent).toBe('nope')
    await waitFor(() => expect((screen.getByText('show-answer') as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByText('hide-card'))
    await waitFor(() => expect(screen.queryByTestId('error')).toBeNull())
    expect(actions.getNextCardAction).toHaveBeenCalledTimes(1)
  })

  it('locks the tag filter while a request is pending', async () => {
    let resolve!: (v: unknown) => void
    actions.getNextCardAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    render(<StudySession deck={deck} tags={tags} />)
    await waitFor(() => expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true))
    await act(async () => resolve(withCard()))
    await screen.findByText('hola')
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(false)
  })

  it('retries loading after a review without submitting it again', async () => {
    actions.getNextCardAction
      .mockResolvedValueOnce(withCard())
      .mockResolvedValueOnce({ success: false, error: 'boom' })
      .mockResolvedValueOnce(withCard(null))
    actions.reviewCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    await clickWhenEnabled('next')

    expect((await screen.findByTestId('error')).textContent).toBe('boom')
    expect(screen.queryByText('hola')).toBeNull()
    expect(screen.queryByText('next')).toBeNull()
    await clickWhenEnabled('common.retry')
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(actions.reviewCardAction).toHaveBeenCalledTimes(1)
  })

  it('flips the card by click or its flip button, but not from controls inside it', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    const flipButton = screen.getByRole('button', { name: 'flip-card' })

    fireEvent.click(screen.getByTestId('audio'))
    expect(screen.queryByText('hello')).toBeNull()
    fireEvent.click(screen.getByText('hola'))
    expect(screen.getByText('hello')).toBeTruthy()
    expect(flipButton.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('hard')).toBeTruthy()
    expect(screen.queryByText('show-answer')).toBeNull()

    fireEvent.click(flipButton)
    expect(screen.queryByText('hello')).toBeNull()
    expect(screen.getByText('show-answer')).toBeTruthy()
    expect(flipButton.getAttribute('aria-pressed')).toBe('false')
  })

  it('starts a new progress target when the tag filter changes', async () => {
    actions.getNextCardAction
      .mockResolvedValueOnce(withCard(card, { due_cards: 50 }))
      .mockResolvedValueOnce(withCard(card, { due_cards: 5 }))
    render(<StudySession deck={deck} tags={tags} />)
    expect(await screen.findByText('due-progress:{"cleared":0,"target":50,"percent":"0%"}')).toBeTruthy()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    expect(await screen.findByText('due-progress:{"cleared":0,"target":5,"percent":"0%"}')).toBeTruthy()
  })

  it('measures progress against the due count at session start', async () => {
    actions.getNextCardAction
      .mockResolvedValueOnce(withCard(card, { due_cards: 300 }))
      .mockResolvedValueOnce(withCard({ ...card, id: 'c2' }, { due_cards: 297 }))
    actions.reviewCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    await clickWhenEnabled('next')
    expect(await screen.findByText('due-progress:{"cleared":3,"target":300,"percent":"1%"}')).toBeTruthy()
  })

  it('shows two decimals below one percent', async () => {
    actions.getNextCardAction
      .mockResolvedValueOnce(withCard(card, { due_cards: 400 }))
      .mockResolvedValueOnce(withCard({ ...card, id: 'c2' }, { due_cards: 401 }))
    actions.reviewCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    await clickWhenEnabled('next')
    expect(await screen.findByText('due-progress:{"cleared":1,"target":400,"percent":"0.25%"}')).toBeTruthy()
  })

  it('edits the current fact in place and reloads the card', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    expect(screen.queryByTestId('edit-fact-modal')).toBeNull()
    fireEvent.click(screen.getByText('edit-fact'))
    expect(screen.getByTestId('edit-fact-modal').textContent).toContain('f1')
    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByText('report-issue')).toBeNull()

    fireEvent.click(screen.getByText('save-fact'))
    await waitFor(() => expect(actions.getNextCardAction).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('edit-fact-modal')).toBeNull()
  })

  it('deletes a card after confirmation', async () => {
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValue(withCard(null))
    actions.deleteCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getAllByText('delete-card')[0])
    fireEvent.click(screen.getByText('dismiss'))
    expect(screen.queryByText('delete-card-confirm')).toBeNull()
    fireEvent.click(screen.getAllByText('delete-card')[0])
    expect(screen.getByText('delete-card-confirm')).toBeTruthy()
    fireEvent.click(screen.getAllByText('delete-card').at(-1)!)
    await waitFor(() => expect(actions.deleteCardAction).toHaveBeenCalledWith({ deckId: 'd1', cardId: 'c1' }))
    expect(screen.queryByText('delete-card-confirm')).toBeNull()
  })

  it('treats a front-only card as having no back', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard({ ...card, back: [] }))
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    expect(screen.queryByText('hello')).toBeNull()
  })

  it('lets importers report an issue on the current fact', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    submitReport.mockResolvedValue({ success: true })
    render(<StudySession deck={{ ...deck, source_deck_id: 'src' } as Deck} tags={tags} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('report-issue'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByText('submit'))
    })
    expect(submitReport).toHaveBeenCalledWith(
      { importDeckId: 'd1', factId: 'f1', data: { message: 'report-kind-audio' } },
      null,
      expect.any(FormData),
    )
    expect(toast).toHaveBeenCalledWith('report-sent')
  })

  it('resets card media state when the next card loads', async () => {
    const second = { ...card, id: 'c2', front: [{ text: 'adiós' }] }
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValue(withCard(second))
    actions.reviewCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} tags={tags} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    await clickWhenEnabled('next')
    expect(await screen.findByText('adiós')).toBeTruthy()
    // the new card starts hidden again (fresh card subtree)
    expect(screen.getByText('show-answer')).toBeTruthy()
  })
})
