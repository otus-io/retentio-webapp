import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({ getFactAction: vi.fn(), updateFactEntriesAction: vi.fn() }))

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/facts/facts.action', () => actions)
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppTextarea', () => ({
  default: ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))

import StudyEditFactModal from '@/components/study/StudyEditFactModal'

function setup(fields = ['Word', 'Meaning', 'Note']) {
  const setIsOpen = vi.fn()
  const onSaved = vi.fn()
  const view = render(
    <StudyEditFactModal deckId="d1" fields={fields} factId="f1" isOpen setIsOpen={setIsOpen} onSaved={onSaved} />,
  )
  return { setIsOpen, onSaved, ...view }
}

describe('StudyEditFactModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('edits the text of each field and keeps the media', async () => {
    actions.getFactAction.mockResolvedValue({
      success: true,
      data: { id: 'f1', entries: [{ text: 'hola', audio: 'a1' }, { text: 'hello' }] },
    })
    actions.updateFactEntriesAction.mockResolvedValue({ success: true })
    const { setIsOpen, onSaved } = setup()

    const word = await screen.findByLabelText('Word') as HTMLTextAreaElement
    expect(word.value).toBe('hola')
    expect((screen.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('')
    fireEvent.change(word, { target: { value: 'adiós' } })
    fireEvent.change(screen.getByLabelText('Meaning'), { target: { value: '  ' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'greeting' } })
    await act(async () => fireEvent.click(screen.getByText('save')))

    expect(actions.getFactAction).toHaveBeenCalledWith('d1', 'f1')
    expect(actions.updateFactEntriesAction).toHaveBeenCalledWith('d1', 'f1', [
      { text: 'adiós', audio: 'a1' },
      {},
      { text: 'greeting' },
    ])
    expect(setIsOpen).toHaveBeenCalledWith(false)
    expect(onSaved).toHaveBeenCalled()
  })

  it('labels entries beyond the deck fields by position and shows save errors', async () => {
    const entries = [{ text: 'a' }, { text: 'b' }]
    actions.getFactAction.mockResolvedValue({ success: true, data: { id: 'f1', entries } })
    actions.updateFactEntriesAction.mockResolvedValueOnce({ success: false, error: 'Forbidden' })
      .mockResolvedValueOnce({ success: false })
    const { onSaved } = setup(['Word'])
    expect(await screen.findByLabelText('#2')).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByText('save')))
    expect(screen.getByTestId('error').textContent).toBe('Forbidden')
    await act(async () => fireEvent.click(screen.getByText('save')))
    await waitFor(() => expect(screen.queryByTestId('error')).toBeNull())
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows a load error without a save button', async () => {
    actions.getFactAction.mockResolvedValueOnce({ success: false, error: 'Fact not found' })
    setup()
    expect((await screen.findByTestId('error')).textContent).toBe('Fact not found')
    expect(screen.queryByText('save')).toBeNull()
  })

  it('shows an empty load error when the action gives none', async () => {
    actions.getFactAction.mockResolvedValueOnce({ success: false })
    setup()
    await waitFor(() => expect(actions.getFactAction).toHaveBeenCalled())
    expect(screen.queryByText('save')).toBeNull()
  })

  it('ignores a load that finishes after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getFactAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { unmount } = setup()
    unmount()
    await act(async () => resolve({ success: true, data: { id: 'f1', entries: [] } }))
    expect(screen.queryByLabelText('Word')).toBeNull()
  })
})
