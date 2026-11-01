import type { FormEvent, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { loginAction, registerAction } from '@/modules/auth/auth.action'
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/modules/auth/auth.schema'
import { showWarningToast } from '@/lib/ui'

const nav = vi.hoisted(() => ({
  search: new URLSearchParams(),
}))

const terms = vi.hoisted(() => ({
  include: false,
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => nav.search,
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
  default: () => (
    terms.include
      ? <input name="terms" value="true" readOnly />
      : <div>terms</div>
  ),
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
  Form: ({
    children,
    onSubmit,
  }: {
    children?: ReactNode
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  }) => <form onSubmit={onSubmit}>{children}</form>,
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
  beforeEach(() => {
    nav.search = new URLSearchParams()
    terms.include = false
    vi.mocked(showWarningToast).mockClear()
    vi.mocked(loginAction).mockClear()
    vi.mocked(registerAction).mockClear()
  })

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

  it('keeps the account switch link on the auth path when there is no redirect', () => {
    render(<AuthForm type="login" />)
    expect(screen.getByRole('link', { name: 'goRegister' }).getAttribute('href')).toBe('/register')
  })

  it('preserves the redirect on the account switch link', () => {
    nav.search = new URLSearchParams('redirect=/decks')
    const { unmount } = render(<AuthForm type="login" />)
    expect(screen.getByRole('link', { name: 'goRegister' }).getAttribute('href'))
      .toBe('/register?redirect=/decks')
    unmount()

    render(<AuthForm type="register" />)
    expect(screen.getByRole('link', { name: 'goLogin' }).getAttribute('href'))
      .toBe('/login?redirect=/decks')
  })

  it('submits login credentials without a terms warning', () => {
    render(<AuthForm type="login" />)
    fireEvent.change(screen.getByRole('textbox', { name: 'usernameLabel' }), {
      target: { value: 'ada' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'passwordLabel' }), {
      target: { value: 'secret' },
    })
    fireEvent.submit(document.querySelector('form')!)

    expect(showWarningToast).not.toHaveBeenCalled()
    expect(loginAction).toHaveBeenCalledTimes(1)
    const formData = vi.mocked(loginAction).mock.calls[0][1] as FormData
    expect(formData.get('username')).toBe('ada')
    expect(formData.get('password')).toBe('secret')
    expect(formData.get('redirect')).toBe('/')
    expect(registerAction).not.toHaveBeenCalled()
  })

  it('warns and does not register when terms are not accepted', () => {
    render(<AuthForm type="register" />)
    fireEvent.submit(document.querySelector('form')!)

    expect(showWarningToast).toHaveBeenCalledWith('termsWarning')
    expect(registerAction).not.toHaveBeenCalled()
  })

  it('registers when terms are accepted', () => {
    terms.include = true
    render(<AuthForm type="register" />)
    fireEvent.change(screen.getByRole('textbox', { name: 'usernameLabel' }), {
      target: { value: 'ada' },
    })
    fireEvent.submit(document.querySelector('form')!)

    expect(showWarningToast).not.toHaveBeenCalled()
    expect(registerAction).toHaveBeenCalledTimes(1)
    const formData = vi.mocked(registerAction).mock.calls[0][1] as FormData
    expect(formData.get('terms')).toBe('true')
    expect(formData.get('username')).toBe('ada')
    expect(loginAction).not.toHaveBeenCalled()
  })
})
