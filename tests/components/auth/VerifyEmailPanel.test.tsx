import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const replaceMock = vi.fn()
const verifyEmailActionMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/modules/auth/auth.action', () => ({
  verifyEmailAction: (...args: unknown[]) => verifyEmailActionMock(...args),
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    [key: string]: unknown
  }) => (
    <button type="button" onClick={onPress} {...rest}>{children}</button>
  ),
}))

vi.mock('@/components/app/AppError', () => ({
  default: ({ error }: { error?: string | null }) =>
    error ? <div data-testid="app-error">{error}</div> : null,
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href }: { children?: ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@heroui/react', () => ({
  Card: Object.assign(
    ({ children }: { children?: ReactNode }) => <div data-testid="card">{children}</div>,
    {
      Header: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
      Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
      Description: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
      Content: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  ),
}))

import VerifyEmailPanel from '@/components/auth/VerifyEmailPanel'

describe('VerifyEmailPanel', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    verifyEmailActionMock.mockReset()
  })

  it('shows success without calling the API when already verified', () => {
    render(
      <VerifyEmailPanel
        token=""
        initialStatus="success"
        initialError={null}
      />,
    )
    expect(screen.getByText('verifyEmailSuccess')).toBeDefined()
    expect(verifyEmailActionMock).not.toHaveBeenCalled()
  })

  it('shows a localized missing-token error without calling the API', () => {
    render(
      <VerifyEmailPanel
        token=""
        initialStatus="error"
        initialError="verifyEmailMissingToken"
      />,
    )
    expect(screen.getByTestId('app-error').textContent).toBe('verifyEmailMissingToken')
    expect(verifyEmailActionMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'verifyEmailRetry' })).toBeNull()
  })

  it('verifies once on pending + token and replaces URL on success', async () => {
    verifyEmailActionMock.mockResolvedValue({ success: true })
    render(
      <VerifyEmailPanel
        token="tok-1"
        initialStatus="pending"
        initialError={null}
      />,
    )
    expect(screen.getByText('verifyEmailPending')).toBeDefined()
    await waitFor(() => {
      expect(verifyEmailActionMock).toHaveBeenCalledWith('tok-1')
      expect(replaceMock).toHaveBeenCalledWith('/verify-email?verified=1')
    })
  })

  it('shows error and retry when verification fails', async () => {
    verifyEmailActionMock.mockResolvedValue({
      success: false,
      error: 'Invalid or expired verification token',
    })
    render(
      <VerifyEmailPanel
        token="bad"
        initialStatus="pending"
        initialError={null}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('app-error').textContent).toBe(
        'Invalid or expired verification token',
      )
    })
    expect(screen.getByRole('button', { name: 'verifyEmailRetry' })).toBeDefined()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
