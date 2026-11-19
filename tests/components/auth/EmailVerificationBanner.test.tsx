import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const showSuccessToast = vi.fn()
const showFailToast = vi.fn()
const userState = vi.hoisted(() => ({ user: null as unknown }))
const openModal = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    `${key}${values?.email ? `:${values.email}` : ''}`,
}))
vi.mock('@/context/UserContext', () => ({ useUserContext: () => ({ user: userState.user }) }))
vi.mock('@/lib/ui', () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showFailToast: (...args: unknown[]) => showFailToast(...args),
}))
vi.mock('@/modules/auth/auth.action', () => ({ resendVerificationAction: vi.fn() }))
vi.mock('@/components/auth/ChangeEmailModal', () => ({
  default: ({ currentEmail }: { currentEmail: string }) => <div data-testid="modal">{currentEmail}</div>,
}))
vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, onPress }: { children?: ReactNode, onPress?: () => void }) => (
    <button type="button" onClick={onPress}>{children}</button>
  ),
}))
vi.mock('@heroui/react', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Alert: Object.assign(Pass, { Indicator: () => null, Content: Pass, Title: Pass, Description: Pass }),
    useOverlayState: () => ({ isOpen: false, open: openModal, close: vi.fn(), setOpen: vi.fn(), toggle: vi.fn() }),
  }
})

import { resendVerificationAction } from '@/modules/auth/auth.action'
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner'

function profile(emailVerified: boolean) {
  return { data: { username: 'alice', email: 'a@b.com', email_verified: emailVerified }, meta: { created_at: '' } }
}

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for logged-out users', () => {
    userState.user = null
    const { container } = render(<EmailVerificationBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing once the email is verified', () => {
    userState.user = profile(true)
    const { container } = render(<EmailVerificationBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('shows the address and the change-email modal for unverified users', () => {
    userState.user = profile(false)
    render(<EmailVerificationBanner />)
    expect(screen.getByText('emailUnverifiedBanner:a@b.com')).toBeDefined()
    expect(screen.getByTestId('modal').textContent).toBe('a@b.com')
    fireEvent.click(screen.getByRole('button', { name: 'changeEmail' }))
    expect(openModal).toHaveBeenCalled()
  })

  it('toasts success after resending the link', async () => {
    userState.user = profile(false)
    vi.mocked(resendVerificationAction).mockResolvedValue({ success: true })
    render(<EmailVerificationBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'resendVerification' }))
    await waitFor(() => expect(showSuccessToast).toHaveBeenCalledWith('verificationSent'))
    expect(resendVerificationAction).toHaveBeenCalledWith('a@b.com')
  })

  it('toasts the error when resending fails', async () => {
    userState.user = profile(false)
    vi.mocked(resendVerificationAction).mockResolvedValue({ success: false, error: 'boom' })
    render(<EmailVerificationBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'resendVerification' }))
    await waitFor(() => expect(showFailToast).toHaveBeenCalledWith('boom'))
  })
})
