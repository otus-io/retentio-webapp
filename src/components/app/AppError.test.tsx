import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AlertProps, AlertContentProps, AlertTitleProps, AlertDescriptionProps } from '@heroui/react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = { 'error.title': '错误' }
    return map[key] || key
  },
}))

vi.mock('@heroui/react', () => ({
  Alert: Object.assign(
    ({ children, status }: AlertProps) => (
      <div data-testid="alert" data-status={status}>{children}</div>
    ),
    {
      Indicator: () => <span data-testid="alert-indicator" />,
      Content: ({ children }: AlertContentProps) => <div data-testid="alert-content">{children}</div>,
      Title: ({ children }: AlertTitleProps) => <span data-testid="alert-title">{children}</span>,
      Description: ({ children }: AlertDescriptionProps) => <span data-testid="alert-description">{children}</span>,
    },
  ),
}))

import AppError from './AppError'

describe('AppError', () => {
  it('error 为 null 时不渲染', () => {
    const { container } = render(<AppError error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('渲染 Error 对象的消息', () => {
    render(<AppError error={new Error('网络连接失败')} />)
    expect(screen.getByTestId('alert')).toBeDefined()
    expect(screen.getByText('网络连接失败')).toBeDefined()
  })

  it('渲染字符串错误', () => {
    render(<AppError error="请求超时" />)
    expect(screen.getByText('请求超时')).toBeDefined()
  })

  it('page 属性添加额外样式', () => {
    render(<AppError error="错误" page />)
    const alert = screen.getByTestId('alert')
    expect(alert.parentElement!.className).toContain('py-4')
  })
})
