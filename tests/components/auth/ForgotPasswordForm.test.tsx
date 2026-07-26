import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/modules/auth/auth.action', () => ({
  forgotPasswordAction: vi.fn(),
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, ...rest }: { children?: ReactNode, [key: string]: unknown }) => (
    <button type="submit" {...rest}>{children}</button>
  ),
}))

vi.mock('@/components/app/AppError', () => ({
  default: () => null,
}))

vi.mock('@/components/app/AppInput', () => ({
  default: ({ name, label }: { name?: string, label?: ReactNode }) => (
    <label>
      {label}
      <input name={name} type="email" />
    </label>
  ),
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href }: { children?: ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@heroui/react', () => ({
  Card: Object.assign(
    ({ children }: { children?: ReactNode }) => <div>{children}</div>,
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

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

describe('ForgotPasswordForm', () => {
  it('renders email form and login link', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByText('forgotPasswordTitle')).toBeDefined()
    expect(screen.getByRole('button', { name: 'forgotPasswordButton' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'goLogin' }).getAttribute('href')).toBe('/login')
  })
})
