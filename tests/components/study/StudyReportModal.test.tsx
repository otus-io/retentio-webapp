import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitReport = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/contributions/contributions.action', () => ({
  submitReportContributionAction: (...a: unknown[]) => submitReport(...a),
}))
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

import StudyReportModal from '@/components/study/StudyReportModal'

function setup() {
  const setIsOpen = vi.fn()
  const onSuccess = vi.fn()
  render(<StudyReportModal importDeckId="i1" factId="f1" isOpen setIsOpen={setIsOpen} onSuccess={onSuccess} />)
  return { setIsOpen, onSuccess }
}

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getByText('submit'))
  })
}

const sentMessage = () => submitReport.mock.calls.at(-1)![0].data.message

describe('StudyReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    submitReport.mockResolvedValue({ success: true })
  })

  it('prefixes details with the issue kind', async () => {
    const { setIsOpen, onSuccess } = setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'content' } })
    fireEvent.change(screen.getByLabelText('report-details'), { target: { value: ' wrong meaning ' } })
    await submit()
    expect(sentMessage()).toBe('report-kind-content: wrong meaning')
    expect(setIsOpen).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('requires details for "other" and sends them as-is', async () => {
    setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other' } })
    await submit()
    expect(screen.getByTestId('error').textContent).toBe('report-details-required')
    expect(submitReport).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('report-details'), { target: { value: 'typo' } })
    await submit()
    expect(sentMessage()).toBe('typo')
  })

  it('falls back to audio when the kind is cleared', async () => {
    setup()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    await submit()
    expect(sentMessage()).toBe('report-kind-audio')
  })

  it('shows the server error', async () => {
    submitReport.mockResolvedValueOnce({ success: false, error: 'daily contribution limit exceeded' })
      .mockResolvedValueOnce(null)
    const { onSuccess } = setup()
    await submit()
    expect(screen.getByTestId('error').textContent).toBe('daily contribution limit exceeded')
    await submit()
    expect(screen.queryByTestId('error')).toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
