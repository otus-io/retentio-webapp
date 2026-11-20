import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({ getFactAction: vi.fn(), updateFactEntriesAction: vi.fn() }))
const sendFactEdits = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ showSuccessToast: vi.fn(), showFailToast: vi.fn() }))

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/facts/facts.action', () => actions)
vi.mock('@/modules/contributions/auto-send', () => ({ sendFactEdits }))
vi.mock('@/lib/ui', () => toast)
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

function setup(fields = ['Word', 'Meaning', 'Note'], imported = false) {
  const setIsOpen = vi.fn()
  const onSaved = vi.fn()
  const view = render(
    <StudyEditFactModal
      deckId="d1"
      fields={fields}
      factId="f1"
      isOpen
      setIsOpen={setIsOpen}
      onSaved={onSaved}
      imported={imported}
    />,
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
    expect(screen.getByTestId('error').textContent).toBe('edit-fact-save-failed')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows a load error without a save button', async () => {
    actions.getFactAction.mockResolvedValueOnce({ success: false, error: 'Fact not found' })
    setup()
    expect((await screen.findByTestId('error')).textContent).toBe('Fact not found')
    expect(screen.queryByText('save')).toBeNull()
  })

  it('falls back to a load error instead of spinning when the action gives none', async () => {
    actions.getFactAction.mockResolvedValueOnce({ success: false })
    setup()
    expect((await screen.findByTestId('error')).textContent).toBe('edit-fact-load-failed')
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('save')).toBeNull()
  })

  it('does not pad the fact with untouched deck fields', async () => {
    const entries = [{ text: 'hola' }, { text: 'x' }]
    actions.getFactAction.mockResolvedValue({ success: true, data: { id: 'f1', entries } })
    actions.updateFactEntriesAction.mockResolvedValue({ success: true })
    setup(['Word', 'Meaning', 'Note', 'Extra'])
    fireEvent.change(await screen.findByLabelText('Meaning'), { target: { value: '' } })
    await act(async () => fireEvent.click(screen.getByText('save')))
    expect(actions.updateFactEntriesAction).toHaveBeenCalledWith('d1', 'f1', [{ text: 'hola' }, {}])
  })

  it('ignores a load that finishes after closing', async () => {
    let resolve!: (v: unknown) => void
    actions.getFactAction.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { unmount } = setup()
    unmount()
    await act(async () => resolve({ success: true, data: { id: 'f1', entries: [] } }))
    expect(screen.queryByLabelText('Word')).toBeNull()
  })

  it('sends an edit on an imported deck to the author, and says when it could not', async () => {
    actions.getFactAction.mockResolvedValue({ success: true, data: { id: 'f1', entries: [{ text: 'hola' }] } })
    actions.updateFactEntriesAction.mockResolvedValue({ success: true })
    sendFactEdits.mockResolvedValueOnce({ sent: 1, unsent: 0 }).mockResolvedValueOnce({ sent: 0, unsent: 1 })
    const { unmount } = setup(['Word'], true)
    fireEvent.change(await screen.findByLabelText('Word'), { target: { value: 'hola!' } })
    await act(async () => fireEvent.click(screen.getByText('save')))
    expect(sendFactEdits).toHaveBeenCalledWith('d1', [{ factId: 'f1', entries: [{ text: 'hola!' }] }])
    expect(toast.showSuccessToast).toHaveBeenCalledWith('sent')
    unmount()

    setup(['Word'], true)
    const save = await screen.findByText('save')
    await act(async () => fireEvent.click(save))
    expect(toast.showFailToast).toHaveBeenCalledWith('unsent')
  })

  it('does not send edits on your own deck', async () => {
    actions.getFactAction.mockResolvedValue({ success: true, data: { id: 'f1', entries: [{ text: 'hola' }] } })
    actions.updateFactEntriesAction.mockResolvedValue({ success: true })
    setup(['Word'])
    const save = await screen.findByText('save')
    await act(async () => fireEvent.click(save))
    expect(sendFactEdits).not.toHaveBeenCalled()
  })
})
