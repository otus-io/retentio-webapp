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
  default: ({ mediaId }: { mediaId: string }) => <span data-testid="audio">{mediaId}</span>,
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
  tags: [{ id: 't1', name: 'verbs' }],
} as unknown as Deck

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
    render(<StudySession deck={deck} />)

    expect(await screen.findByText('hola')).toBeTruthy()
    expect(screen.getByTestId('audio').textContent).toBe('a1')
    expect(screen.queryByText('hello')).toBeNull()
    expect(screen.getByText('progress:{"studied":0,"due":5}')).toBeTruthy()

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
    expect(screen.getByText('progress:{"studied":1,"due":5}')).toBeTruthy()
  })

  it('filters by tag and reloads when caught up', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard(null, null))
    render(<StudySession deck={deck} />)
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(actions.getNextCardAction).toHaveBeenLastCalledWith('d1', undefined)
    expect(screen.getByText('progress:{"studied":0,"due":0}')).toBeTruthy()

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
    render(<StudySession deck={{ ...deck, tags: undefined } as unknown as Deck} />)
    expect(await screen.findByTestId('error')).toBeTruthy()
    expect(screen.getByTestId('error').textContent).toBe('Deck not found')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('shows an empty error string when the action gives none', async () => {
    actions.getNextCardAction.mockResolvedValue({ success: false })
    render(<StudySession deck={deck} />)
    await waitFor(() => expect(actions.getNextCardAction).toHaveBeenCalled())
    expect(screen.queryByText('hola')).toBeNull()
  })

  it('hides a card without counting it as studied', async () => {
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValue(withCard(null))
    actions.hideCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('hide-card'))
    await waitFor(() => expect(actions.hideCardAction).toHaveBeenCalledWith({ deckId: 'd1', cardId: 'c1' }))
    expect(await screen.findByText('caught-up-title')).toBeTruthy()
    expect(screen.getByText('progress:{"studied":0,"due":5}')).toBeTruthy()
  })

  it('reports a failed mutation and keeps the card', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    actions.hideCardAction.mockResolvedValueOnce({ success: false, error: 'nope' }).mockResolvedValueOnce({ success: false })
    render(<StudySession deck={deck} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('hide-card'))
    expect((await screen.findByTestId('error')).textContent).toBe('nope')
    await waitFor(() => expect((screen.getByText('show-answer') as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByText('hide-card'))
    await waitFor(() => expect(screen.queryByTestId('error')).toBeNull())
    expect(actions.getNextCardAction).toHaveBeenCalledTimes(1)
  })

  it('opens the facts editor', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    render(<StudySession deck={deck} />)
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('edit-fact'))
    expect(push).toHaveBeenCalledWith('/decks/d1/facts')
    expect(screen.queryByText('report-issue')).toBeNull()
  })

  it('deletes a card after confirmation', async () => {
    actions.getNextCardAction.mockResolvedValueOnce(withCard()).mockResolvedValue(withCard(null))
    actions.deleteCardAction.mockResolvedValue({ success: true })
    render(<StudySession deck={deck} />)
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
    render(<StudySession deck={deck} />)
    await screen.findByText('hola')
    await clickWhenEnabled('show-answer')
    expect(screen.queryByText('hello')).toBeNull()
  })

  it('lets importers report an issue on the current fact', async () => {
    actions.getNextCardAction.mockResolvedValue(withCard())
    submitReport.mockResolvedValue({ success: true })
    render(<StudySession deck={{ ...deck, source_deck_id: 'src' } as Deck} />)
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
})
