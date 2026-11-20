import { act, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  getQaFactAction: vi.fn(),
  getQualityStatsAction: vi.fn(),
  putFactQualityAction: vi.fn(),
  startQaWalkAction: vi.fn(),
  submitQaReviewAction: vi.fn(),
}))
const push = vi.fn()
const toast = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/modules/quality/quality.action', () => actions)
vi.mock('@/lib/ui', () => ({ showSuccessToast: (m: string) => toast(m) }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/layout/LayoutPage', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('@/components/facts/FactsAudioPlayButton', () => ({
  default: ({ mediaId }: { mediaId: string }) => <span data-testid="audio">{mediaId}</span>,
}))

import QaSession from '@/components/qa/QaSession'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = { id: 'd1', name: 'Spanish', fields: ['Word', 'Meaning', 'Note'] } as unknown as Deck
const stats = { verified_aspects: 0, total_aspects: 4, verified_facts: 1, total_facts: 3 }
const fact = (id: string, entries: unknown[]) => ({ success: true, data: { fact: { id, entries }, quality: null } })

const checkboxFor = (label: string) => screen.getByText(label).closest('label')!.querySelector('input')!

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: vi.fn((k: string, v: string) => { map.set(k, v) }),
    clear: () => map.clear(),
  }
}


configure({ asyncUtilTimeout: 5000 })

async function clickWhenEnabled(text: string) {
  const el = await screen.findByText(text)
  await waitFor(() => expect((screen.getByText(text) as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(screen.getByText(text))
  return el
}

describe('QaSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('localStorage', memoryStorage())
    actions.getQualityStatsAction.mockResolvedValue({ success: true, data: stats })
  })

  it('walks unverified facts, signing off checked columns', async () => {
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: ['f1', 'f2'], stats } })
    actions.getQaFactAction
      .mockResolvedValueOnce(fact('f1', [{ text: 'hola', audio: 'a1' }, { text: 'hello' }, { image: 'i' }]))
      .mockResolvedValueOnce(fact('f2', [{ text: 'adiós' }, {}, {}]))
      .mockResolvedValueOnce(fact('f1', [{ text: 'hola' }, {}, {}]))
    actions.putFactQualityAction.mockResolvedValue({ success: true })
    render(<QaSession deck={deck} />)

    expect(await screen.findByText('progress:{"verified":1,"total":3}')).toBeTruthy()
    fireEvent.click(checkboxFor('Note'))
    await clickWhenEnabled('start')
    await waitFor(() => expect(actions.startQaWalkAction).toHaveBeenCalledWith('d1', [0, 1]))
    expect(localStorage.getItem('qa_columns_d1')).toBe('[0,1]')

    expect(await screen.findByText('hola')).toBeTruthy()
    expect(screen.getByTestId('audio').textContent).toBe('a1')
    expect(screen.getByText('position:{"current":1,"total":2}')).toBeTruthy()
    const next = screen.getByText('verify-next') as HTMLButtonElement
    expect(next.disabled).toBe(true)

    const boxes = screen.getAllByText('verified').map((el) => el.closest('label')!.querySelector('input')!)
    expect(boxes).toHaveLength(2)
    fireEvent.click(boxes[0])
    fireEvent.click(boxes[1])
    fireEvent.click(boxes[1])
    expect(next.disabled).toBe(true)
    fireEvent.click(boxes[1])
    expect(next.disabled).toBe(false)

    await act(async () => {
      fireEvent.click(next)
    })
    expect(actions.putFactQualityAction).toHaveBeenCalledWith('d1', 'f1', {
      0: { text: { score: 10, model: 'human' }, audio: { score: 10, model: 'human' } },
      1: { text: { score: 10, model: 'human' } },
    })
    expect(await screen.findByText('adiós')).toBeTruthy()

    await clickWhenEnabled('prev')
    expect(await screen.findByText('hola')).toBeTruthy()
  })

  it('advances without saving when nothing is scoreable and finishes the walk', async () => {
    localStorage.setItem('qa_columns_d1', JSON.stringify([1]))
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: ['f1'], stats: null } })
    actions.getQaFactAction.mockResolvedValue(fact('f1', [{ text: 'hola' }, { image: 'i' }]))
    render(<QaSession deck={deck} />)
    await waitFor(() => expect(actions.getQualityStatsAction).toHaveBeenCalled())
    await clickWhenEnabled('start')
    await waitFor(() => expect(actions.startQaWalkAction).toHaveBeenCalledWith('d1', [1]))
    const finish = await screen.findByText('verify-finish')
    await waitFor(() => expect((finish as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(finish)
    expect(await screen.findByText('complete-title')).toBeTruthy()
    expect(actions.putFactQualityAction).not.toHaveBeenCalled()
    expect(screen.queryByText('share-with-author')).toBeNull()

    await clickWhenEnabled('change-columns')
    expect(screen.getByText('pick-columns')).toBeTruthy()
  })

  it('opens the completion screen when nothing is left, and lets importers share', async () => {
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: [], stats } })
    actions.submitQaReviewAction.mockResolvedValueOnce({ success: true, data: { aspects: 3 } })
      .mockResolvedValueOnce({ success: false, error: 'nothing to review' })
    render(<QaSession deck={{ ...deck, source_deck_id: 'src' } as Deck} />)
    await clickWhenEnabled('start')
    await clickWhenEnabled('share-with-author')
    await waitFor(() => expect(toast).toHaveBeenCalledWith('review-sent:{"count":3}'))
    await clickWhenEnabled('share-with-author')
    expect((await screen.findByTestId('error')).textContent).toBe('nothing to review')
  })

  it('surfaces walk, fact and save errors', async () => {
    actions.getQualityStatsAction.mockResolvedValue({ success: false })
    actions.startQaWalkAction.mockResolvedValueOnce({ success: false, error: 'bad columns' })
      .mockResolvedValue({ success: true, data: { factIds: ['f1', 'f2'], stats } })
    actions.getQaFactAction.mockResolvedValueOnce({ success: false, error: 'Fact not found' })
      .mockResolvedValue(fact('f2', [{ text: 'hola' }]))
    actions.putFactQualityAction.mockResolvedValue({ success: false, error: 'save failed' })
    render(<QaSession deck={deck} />)

    await clickWhenEnabled('start')
    expect((await screen.findByTestId('error')).textContent).toBe('bad columns')
    await clickWhenEnabled('start')
    expect(await screen.findByText('Fact not found')).toBeTruthy()

    await clickWhenEnabled('skip')
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('verified').closest('label')!.querySelector('input')!)
    await clickWhenEnabled('verify-finish')
    expect(await screen.findByText('save failed')).toBeTruthy()

    fireEvent.click(screen.getByText('edit'))
    expect(push).toHaveBeenCalledWith('/decks/d1/facts')
  })

  it('falls back to all columns for invalid saved picks and disables start with none', async () => {
    localStorage.setItem('qa_columns_d1', '{"bad":1}')
    const { unmount } = render(<QaSession deck={deck} />)
    expect(checkboxFor('Word').checked && checkboxFor('Note').checked).toBe(true)
    unmount()
    localStorage.setItem('qa_columns_d1', '[9]')
    const r2 = render(<QaSession deck={deck} />)
    expect(checkboxFor('Meaning').checked).toBe(true)
    r2.unmount()
    localStorage.setItem('qa_columns_d1', 'not json')
    render(<QaSession deck={{ ...deck, fields: ['Only'] } as Deck} />)
    fireEvent.click(checkboxFor('Only'))
    expect((screen.getByText('start') as HTMLButtonElement).disabled).toBe(true)
    await waitFor(() => expect(actions.getQualityStatsAction).toHaveBeenCalled())
  })

  it('keeps working when localStorage is unavailable', async () => {
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('blocked')
    })
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: [], stats } })
    render(<QaSession deck={deck} />)
    await clickWhenEnabled('start')
    expect(await screen.findByText('complete-title')).toBeTruthy()
  })

  it('shows empty errors when actions omit a message', async () => {
    actions.startQaWalkAction.mockResolvedValueOnce({ success: false })
      .mockResolvedValue({ success: true, data: { factIds: ['f1'], stats } })
    actions.getQaFactAction.mockResolvedValueOnce({ success: false }).mockResolvedValue(fact('f1', [{ text: 'x' }]))
    actions.putFactQualityAction.mockResolvedValue({ success: false })
    actions.submitQaReviewAction.mockResolvedValue({ success: false })
    render(<QaSession deck={deck} />)
    await clickWhenEnabled('start')
    await waitFor(() => expect((screen.getByText('start') as HTMLButtonElement).disabled).toBe(false))
    expect(actions.startQaWalkAction).toHaveBeenCalledTimes(1)
    await clickWhenEnabled('start')
    await waitFor(() => expect(actions.getQaFactAction).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('x')).toBeNull()
  })

  it('handles save and share failures without messages and a failed stats refresh', async () => {
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: ['f1', 'f2'], stats } })
    actions.getQaFactAction.mockResolvedValueOnce(fact('f1', [{ text: 'hola' }]))
      .mockResolvedValue(fact('f2', [{ text: 'adiós' }]))
    actions.putFactQualityAction.mockResolvedValueOnce({ success: false }).mockResolvedValue({ success: true })
    actions.getQualityStatsAction.mockResolvedValueOnce({ success: true, data: stats })
      .mockResolvedValue({ success: false })
    render(<QaSession deck={{ ...deck, fields: ['Word'] } as Deck} />)

    // unchecking and re-checking a column in the picker
    fireEvent.click(checkboxFor('Word'))
    fireEvent.click(checkboxFor('Word'))
    await clickWhenEnabled('start')
    await screen.findByText('hola')
    fireEvent.click(screen.getByText('verified').closest('label')!.querySelector('input')!)
    await clickWhenEnabled('verify-next')
    await waitFor(() => expect(actions.putFactQualityAction).toHaveBeenCalledTimes(1))
    expect(screen.getByText('hola')).toBeTruthy()
    await clickWhenEnabled('verify-next')
    expect(await screen.findByText('adiós')).toBeTruthy()
    expect(screen.getByText('progress:{"verified":1,"total":3}')).toBeTruthy()
  })

  it('skipping the last fact finishes the walk', async () => {
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: ['f1'], stats } })
    actions.getQaFactAction.mockResolvedValue(fact('f1', [{ text: 'hola' }]))
    render(<QaSession deck={deck} />)
    await clickWhenEnabled('start')
    await screen.findByText('hola')
    await clickWhenEnabled('skip')
    expect(await screen.findByText('complete-title')).toBeTruthy()
    expect(actions.putFactQualityAction).not.toHaveBeenCalled()
  })

  it('shows nothing extra when sharing fails without a message', async () => {
    actions.startQaWalkAction.mockResolvedValue({ success: true, data: { factIds: [], stats } })
    actions.submitQaReviewAction.mockResolvedValue({ success: false })
    render(<QaSession deck={{ ...deck, source_deck_id: 'src' } as Deck} />)
    await clickWhenEnabled('start')
    await clickWhenEnabled('share-with-author')
    await waitFor(() => expect(actions.submitQaReviewAction).toHaveBeenCalledWith('d1'))
    expect(toast).not.toHaveBeenCalled()
    expect(screen.queryByTestId('error')).toBeNull()
  })
})
