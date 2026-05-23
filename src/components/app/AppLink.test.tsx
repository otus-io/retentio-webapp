import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ children, className, href, ...rest }: ComponentProps<'a'> & { children?: ReactNode }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

import AppLink from './AppLink'

describe('AppLink', () => {
  it('渲染子元素和 href', () => {
    render(<AppLink href="/home">首页</AppLink>)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/home')
    expect(screen.getByText('首页')).toBeDefined()
  })

  it('isActive 时添加激活样式', () => {
    render(<AppLink href="/" isActive>当前页</AppLink>)
    const link = screen.getByRole('link')
    expect(link.className).toContain('text-accent')
    expect(link.className).toContain('font-bold')
  })

  it('非激活状态使用默认样式', () => {
    render(<AppLink href="/">普通链接</AppLink>)
    const link = screen.getByRole('link')
    expect(link.className).toContain('text-default-600')
  })
})
