import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'

vi.mock('@heroui/react', () => ({
  Breadcrumbs: Object.assign(
    ({ children }: { children?: ReactNode }) => <nav data-testid="breadcrumbs">{children}</nav>,
    {
      Item: ({ children }: { children?: ReactNode }) => <span data-testid="breadcrumb-item">{children}</span>,
    },
  ),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = { 'nav.home': '首页' }
    return map[key] || key
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: ComponentProps<'a'>) => <a href={href}>{children}</a>,
}))

import AppBreadcrumbs from './AppBreadcrumbs'

describe('AppBreadcrumbs', () => {
  it('渲染首页为第一项', () => {
    render(<AppBreadcrumbs items={[]} />)
    expect(screen.getByText('首页')).toBeDefined()
  })

  it('渲染传入的 items', () => {
    render(<AppBreadcrumbs items={[{ href: '/users', title: '用户管理' }, { href: '/users/1', title: '详情' }]} />)
    expect(screen.getByText('用户管理')).toBeDefined()
    expect(screen.getByText('详情')).toBeDefined()
  })

  it('渲染链接', () => {
    render(<AppBreadcrumbs items={[{ href: '/users', title: '用户管理' }]} />)
    const links = screen.getAllByRole('link')
    expect(links[0].getAttribute('href')).toBe('/')
    expect(links[1].getAttribute('href')).toBe('/users')
  })
})
