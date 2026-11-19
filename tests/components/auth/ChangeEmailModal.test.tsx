import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const showSuccessToast = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, string>) =>
    `${ns}.${key}${values?.email ? `:${values.email}` : ''}`,
}))
vi.mock('@/lib/ui', () => ({ showSuccessToast: (...args: unknown[]) => showSuccessToast(...args) }))
vi.mock('@/modules/auth/auth.action', () => ({ changeEmailAction: vi.fn() }))
vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, type, slot: _slot, isPending: _p, isDisabled: _d }: Record<string, unknown>) => (
    <button type={(type as 'submit' | undefined) ?? 'button'}>{children as ReactNode}</button>
  ),
}))
vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string }) => (error ? <p role="alert">{error}</p> : null),
}))
vi.mock('@/components/app/AppInput', () => ({
  default: ({ name, label, defaultValue }: { name: string, label: string, defaultValue?: string }) => (
    <label>{label}<input name={name} defaultValue={defaultValue} /></label>
  ),
}))
vi.mock('@/components/app/AppPasswordInput', () => ({
  default: ({ name, label }: { name: string, label: string }) => (
    <label>{label}<input name={name} type="password" /></label>
  ),
}))
vi.mock('@heroui/react', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Form: ({ children, action }: { children?: ReactNode, action: (fd: FormData) => void }) => (
      <form action={action}>{children}</form>
    ),
    Modal: {
      Backdrop: ({ children, isOpen }: { children?: ReactNode, isOpen: boolean }) => (isOpen ? <div>{children}</div> : null),
      Container: Pass,
      Dialog: Pass,
      CloseTrigger: () => null,
      Header: Pass,
      Heading: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
      Body: Pass,
      Footer: Pass,
    },
  }
})

import { changeEmailAction } from '@/modules/auth/auth.action'
import ChangeEmailModal from '@/components/auth/ChangeEmailModal'

function renderModal(close = vi.fn()) {
  const overlay = { isOpen: true, setOpen: vi.fn(), close, open: vi.fn(), toggle: vi.fn() }
  render(<ChangeEmailModal {...overlay} currentEmail="old@b.com" />)
  return close
}

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('auth.newEmailLabel'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('auth.currentPasswordLabel'), { target: { value: password } })
  fireEvent.submit(document.querySelector('form')!)
}

describe('ChangeEmailModal', () => {
  it('shows the current email and the form fields', () => {
    renderModal()
    expect(screen.getByText('auth.changeEmailDescription:old@b.com')).toBeDefined()
    expect(screen.getByRole('button', { name: 'auth.changeEmail' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeDefined()
  })

  it('shows the error and keeps the modal open when the change fails', async () => {
    vi.mocked(changeEmailAction).mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
      data: { email: 'new@b.com' },
    })
    const close = renderModal()
    submit('new@b.com', 'wrong')
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Invalid credentials')
    expect(close).not.toHaveBeenCalled()
    expect((screen.getByLabelText('auth.newEmailLabel') as HTMLInputElement).value).toBe('new@b.com')
  })

  it('toasts and closes after a successful change', async () => {
    vi.mocked(changeEmailAction).mockResolvedValue({ success: true, data: { email: 'new@b.com' } })
    const close = renderModal()
    submit('new@b.com', 'secret123')
    await waitFor(() => expect(close).toHaveBeenCalled())
    expect(showSuccessToast).toHaveBeenCalledWith('auth.changeEmailSuccess:new@b.com')
    const formData = vi.mocked(changeEmailAction).mock.calls.at(-1)![1] as FormData
    expect(formData.get('email')).toBe('new@b.com')
    expect(formData.get('password')).toBe('secret123')
  })
})
