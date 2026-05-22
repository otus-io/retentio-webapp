import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppButton, { ResetButton, SubmitButton } from './AppButton'

vi.mock('@heroui/react', () => ({
  Button: ({
    children,
    type,
    variant,
    ...props
  }: {
    children?: React.ReactNode | ((props: { isPending?: boolean }) => React.ReactNode)
    type?: string
    variant?: string
    [key: string]: unknown
  }) => {
    const resolved = typeof children === 'function' ? children({ isPending: false }) : children
    return (
      <button type={type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button'} data-variant={variant} {...props}>
        {resolved}
      </button>
    )
  },
  Spinner: ({ className }: { className?: string }) => <span data-testid="spinner" className={className} />,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'common.submit': '提交',
      'common.reset': '重置',
    }
    return map[key] || key
  },
}))

describe('AppButton', () => {
  it('渲染子元素', () => {
    render(<AppButton>点击</AppButton>)
    expect(screen.getByRole('button', { name: '点击' })).toBeDefined()
  })

  it('渲染图标', () => {
    render(<AppButton icon={<span data-testid="icon" />}>按钮</AppButton>)
    expect(screen.getByTestId('icon')).toBeDefined()
  })
})

describe('SubmitButton', () => {
  it('渲染提交按钮', () => {
    render(<SubmitButton />)
    const btn = screen.getByRole('button', { name: '提交' })
    expect(btn).toBeDefined()
    expect(btn.getAttribute('type')).toBe('submit')
  })
})

describe('ResetButton', () => {
  it('渲染重置按钮', () => {
    render(<ResetButton />)
    const btn = screen.getByRole('button', { name: '重置' })
    expect(btn).toBeDefined()
    expect(btn.getAttribute('type')).toBe('reset')
    expect(btn.getAttribute('data-variant')).toBe('outline')
  })
})
