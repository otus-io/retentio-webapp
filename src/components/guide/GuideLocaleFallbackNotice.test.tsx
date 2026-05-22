import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GuideLocaleFallbackNotice from './GuideLocaleFallbackNotice'

vi.mock('@heroui/react', () => {
  const Alert = ({ children, className, status }: {
    children?: React.ReactNode
    className?: string
    status?: string
  }) => (
    <div data-testid="alert" className={className} data-status={status}>
      {children}
    </div>
  )
  Alert.Indicator = () => <div data-testid="alert-indicator" />
  Alert.Content = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  Alert.Description = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
  return { Alert }
})

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'content.fallback-notice': '当前页面在你选择的语言中不可用，已回退到默认语言。',
    }
    return map[key] || key
  },
}))

describe('GuideLocaleFallbackNotice', () => {
  it('渲染警告提示', () => {
    render(<GuideLocaleFallbackNotice />)
    const alert = screen.getByTestId('alert')
    expect(alert).toBeDefined()
    expect(alert.getAttribute('data-status')).toBe('warning')
  })

  it('显示回退提示文字', () => {
    render(<GuideLocaleFallbackNotice />)
    expect(screen.getByText('当前页面在你选择的语言中不可用，已回退到默认语言。')).toBeDefined()
  })

  it('包含 mb-4 样式类', () => {
    render(<GuideLocaleFallbackNotice />)
    expect(screen.getByTestId('alert').className).toContain('mb-4')
  })
})
