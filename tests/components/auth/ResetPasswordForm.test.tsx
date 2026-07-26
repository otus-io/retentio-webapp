import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/modules/auth/auth.action', () => ({
  resetPasswordAction: vi.fn(),
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, ...rest }: { children?: ReactNode, [key: string]: unknown }) => (
    <button type="submit" {...rest}>{children}</button>
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

vi.mock('@/components/app/AppPasswordInput', () => ({
  default: ({ name, label }: { name?: string, label?: ReactNode }) => (
    <label>
      {label}
      <input name={name} type="password" />
    </label>
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
      Footer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    },
  ),
  Form: ({ children, ...rest }: { children?: ReactNode, [key: string]: unknown }) => (
    <form {...rest}>{children}</form>
  ),
}))

import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

describe('ResetPasswordForm', () => {
  it('shows missing-token message and re-request link when token is empty', () => {
    render(<ResetPasswordForm token="" />)
    expect(screen.getByText('resetPasswordMissingToken')).toBeDefined()
    expect(screen.getByRole('link', { name: 'requestNewResetLink' }).getAttribute('href'))
      .toBe('/forgot-password')
    expect(screen.queryByRole('button', { name: 'resetPasswordButton' })).toBeNull()
  })

  it('renders the password form with a hidden token when present', () => {
    const { container } = render(<ResetPasswordForm token="reset-tok" />)
    expect(screen.getByRole('button', { name: 'resetPasswordButton' })).toBeDefined()
    const hidden = container.querySelector('input[name="token"]') as HTMLInputElement | null
    expect(hidden?.value).toBe('reset-tok')
    expect(container.querySelector('input[name="password"]')).toBeTruthy()
    expect(container.querySelector('input[name="confirmPassword"]')).toBeTruthy()
  })
})
