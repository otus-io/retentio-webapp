import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const deleteAccountAction = vi.fn()

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/modules/auth/auth.action', () => ({
  deleteAccountAction: (...a: unknown[]) => deleteAccountAction(...a),
  changeEmailAction: vi.fn(),
}))
vi.mock('@/components/app/AppButton', async () => ({ default: (await import('../../helpers/heroui')).AppButtonMock }))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) => (error ? <div data-testid="error">{error}</div> : null),
}))
vi.mock('@/components/app/AppPasswordInput', () => ({
  default: ({ name, label }: { name: string, label: string }) => <input aria-label={label} name={name} />,
}))
vi.mock('@/components/auth/ChangeEmailModal', () => ({
  default: ({ isOpen, currentEmail }: { isOpen: boolean, currentEmail: string }) =>
    isOpen ? <div data-testid="change-email">{currentEmail}</div> : null,
}))

import ProfileActions from '@/components/auth/ProfileActions'

describe('ProfileActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the change email modal', () => {
    render(<ProfileActions email="a@b.com" />)
    fireEvent.click(screen.getByText('changeEmail'))
    expect(screen.getByTestId('change-email').textContent).toBe('a@b.com')
  })

  it('deletes the account with the password and shows failures', async () => {
    deleteAccountAction.mockResolvedValue({ error: 'Invalid credentials', success: false })
    render(<ProfileActions email="a@b.com" />)
    fireEvent.click(screen.getByText('deleteAccount'))
    expect(screen.getByText('deleteAccountMessage')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('currentPasswordLabel'), { target: { value: 'pw' } })
    await act(async () => {
      fireEvent.submit(screen.getByLabelText('currentPasswordLabel').closest('form')!)
    })
    const fd = deleteAccountAction.mock.calls[0][1] as FormData
    expect(fd.get('password')).toBe('pw')
    expect(screen.getByTestId('error').textContent).toBe('Invalid credentials')
  })
})
