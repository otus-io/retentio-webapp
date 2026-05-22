import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/app/AppBreadcrumbs', () => ({
  default: ({ items }: { items?: Array<{ href: string; title: string }> }) => (
    <nav data-testid="breadcrumbs">{items?.map((i) => i.title).join(' / ')}</nav>
  ),
}))

import LayoutPage from './LayoutPage'

describe('LayoutPage', () => {
  it('渲染子内容', () => {
    render(<LayoutPage><span>页面内容</span></LayoutPage>)
    expect(screen.getByText('页面内容')).toBeDefined()
  })

  it('提供 breadcrumbs 时渲染面包屑', () => {
    const items = [
      { href: '/', title: '首页' },
      { href: '/guide', title: '指南' },
    ]
    render(<LayoutPage breadcrumbs={items}><span>内容</span></LayoutPage>)
    expect(screen.getByTestId('breadcrumbs')).toBeDefined()
    expect(screen.getByText('首页 / 指南')).toBeDefined()
  })

  it('breadcrumbs 为空数组时不渲染面包屑', () => {
    render(<LayoutPage breadcrumbs={[]}><span>内容</span></LayoutPage>)
    expect(screen.queryByTestId('breadcrumbs')).toBeNull()
  })

  it('不提供 breadcrumbs 时不渲染面包屑区域', () => {
    render(<LayoutPage><span>内容</span></LayoutPage>)
    expect(screen.queryByTestId('breadcrumbs')).toBeNull()
  })
})
