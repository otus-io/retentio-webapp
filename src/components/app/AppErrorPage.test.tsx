import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const map: Record<string, string> = { 'common.reset': '重置' }
    const t = (key: string) => map[key] || key
    t.rich = (key: string, elements: Record<string, (chunks: ReactNode) => ReactNode>) => {
      if (key === 'error.not-find-desc') {
        return <>页面未找到 {elements.back('返回')} {elements.home('首页')}</>
      }
      return key
    }
    return t
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href, className }: ComponentProps<'a'>) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('lucide-react', () => ({
  LucideRefreshCcw: ({ size }: LucideProps) => <span data-testid="refresh-icon" data-size={size} />,
}))

import AppErrorPage from './AppErrorPage'

describe('AppErrorPage', () => {
  it('渲染错误码', () => {
    render(<AppErrorPage code={500} message="服务器错误" />)
    expect(screen.getByText('500')).toBeDefined()
  })

  it('渲染错误消息', () => {
    render(<AppErrorPage code={500} message="服务器错误" />)
    expect(screen.getByText('服务器错误')).toBeDefined()
  })

  it('404 时渲染返回和首页链接', () => {
    render(<AppErrorPage code={404} message="页面未找到" />)
    expect(screen.getByText('返回')).toBeDefined()
    expect(screen.getByText('首页')).toBeDefined()
  })

  it('非 404 时不渲染额外描述', () => {
    const { container } = render(<AppErrorPage code={500} message="服务器错误" />)
    expect(container.querySelector('.cursor-pointer')).toBeNull()
  })

  it('有 reset 函数时渲染重置按钮', () => {
    render(<AppErrorPage code={500} message="错误" reset={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('无 reset 时不渲染按钮', () => {
    render(<AppErrorPage code={500} message="错误" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
