import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addFactAction = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => vi.fn())

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/lib/ui', () => ({ showSuccessToast: toast }))
vi.mock('@/modules/facts/facts.action', () => ({ addFactAction }))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppTextarea', () => ({
  default: ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))

import DeckAddFact from '@/components/decks/DeckAddFact'
import type { Deck } from '@/modules/decks/decks.schema'

const deck = (over: Record<string, unknown> = {}) =>
  ({ id: 'd1', fields: ['Word', 'Meaning'], ...over }) as unknown as Deck
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('DeckAddFact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves a fact with the sign-off and clears the form for the next one', async () => {
    addFactAction.mockResolvedValue({ success: true })
    render(<DeckAddFact deck={deck()} />)
    type('Word', 'hola')
    type('Meaning', 'hello')
    fireEvent.click(screen.getByText('mark-verified').closest('label')!.querySelector('input')!)
    await act(async () => fireEvent.click(screen.getByText('submit')))
    expect(addFactAction).toHaveBeenCalledWith('d1', [{ text: 'hola' }, { text: 'hello' }], true)
    expect(toast).toHaveBeenCalledWith('success')
    expect((screen.getByLabelText('Word') as HTMLTextAreaElement).value).toBe('')
    expect((screen.getByText('mark-verified').closest('label')!.querySelector('input') as HTMLInputElement).checked)
      .toBe(false)
  })

  it('requires text in every field', async () => {
    render(<DeckAddFact deck={deck()} />)
    type('Word', 'hola')
    await act(async () => fireEvent.click(screen.getByText('submit')))
    expect(screen.getByTestId('error').textContent).toBe('needs-content')
    expect(addFactAction).not.toHaveBeenCalled()
  })

  it('shows save errors, with a fallback message', async () => {
    addFactAction
      .mockResolvedValueOnce({ success: false, error: 'Forbidden' })
      .mockResolvedValueOnce({ success: false })
    render(<DeckAddFact deck={deck()} />)
    type('Word', 'a')
    type('Meaning', 'b')
    await act(async () => fireEvent.click(screen.getByText('submit')))
    expect(screen.getByTestId('error').textContent).toBe('Forbidden')
    await act(async () => fireEvent.click(screen.getByText('submit')))
    expect(screen.getByTestId('error').textContent).toBe('failed')
    expect((screen.getByLabelText('Word') as HTMLTextAreaElement).value).toBe('a')
  })

  it('has no sign-off on imported decks and a single box for decks without fields', async () => {
    addFactAction.mockResolvedValue({ success: true })
    render(<DeckAddFact deck={deck({ fields: [], source_deck_id: 'src' })} />)
    expect(screen.queryByText('mark-verified')).toBeNull()
    type('#1', 'solo')
    await act(async () => fireEvent.click(screen.getByText('submit')))
    expect(addFactAction).toHaveBeenCalledWith('d1', [{ text: 'solo' }], false)
  })
})
