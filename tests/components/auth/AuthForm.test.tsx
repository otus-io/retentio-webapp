import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/modules/auth/auth.schema'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/modules/auth/auth.action', () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
}))

vi.mock('@/lib/ui', () => ({
  showWarningToast: vi.fn(),
}))

vi.mock('@/components/auth/TermsAgreement', () => ({
  default: () => <div>terms</div>,
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, ...rest }: { children?: ReactNode, [key: string]: unknown }) => (
    <button type="submit" {...rest}>{children}</button>
  ),
}))

vi.mock('@/components/app/AppError', () => ({
  default: () => null,
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href }: { children?: ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

function field({
  name,
  label,
  minLength,
  maxLength,
}: {
  name?: string
  label?: ReactNode
  minLength?: number
  maxLength?: number
}) {
  return (
    <input
      name={name}
      aria-label={typeof label === 'string' ? label : name}
      minLength={minLength}
      maxLength={maxLength}
    />
  )
}

vi.mock('@/components/app/AppInput', () => ({
  default: (props: { name?: string, label?: ReactNode, minLength?: number, maxLength?: number }) => field(props),
}))

vi.mock('@/components/app/AppPasswordInput', () => ({
  default: (props: { name?: string, label?: ReactNode, minLength?: number, maxLength?: number }) => field(props),
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
  Form: ({ children }: { children?: ReactNode }) => <form>{children}</form>,
}))

import AuthForm from '@/components/auth/AuthForm'

function limits(name: string) {
  const input = screen.getByRole('textbox', { name })
  return {
    min: input.getAttribute('minlength'),
    max: input.getAttribute('maxlength'),
  }
}

describe('AuthForm', () => {
  it('does not cap username or password length on login', () => {
    render(<AuthForm type="login" />)
    expect(limits('usernameLabel')).toEqual({ min: null, max: null })
    expect(limits('passwordLabel')).toEqual({ min: null, max: null })
  })

  it('caps username and password length on registration', () => {
    render(<AuthForm type="register" />)
    expect(limits('usernameLabel')).toEqual({
      min: String(USERNAME_MIN),
      max: String(USERNAME_MAX),
    })
    expect(limits('passwordLabel')).toEqual({
      min: String(PASSWORD_MIN),
      max: String(PASSWORD_MAX),
    })
  })
})
