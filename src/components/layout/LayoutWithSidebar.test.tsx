import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SidebarNavItem } from '@/config/sidebar'

vi.mock('@/components/layout/Sidebar', () => ({
  default: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

vi.mock('@/components/layout/SidebarContext', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layout/MainContent', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main data-testid="main-content">{children}</main>,
}))

import LayoutWithSidebar from './LayoutWithSidebar'

describe('LayoutWithSidebar', () => {
  const mockItems: SidebarNavItem[] = [
    { titleKey: 'guide-sidebar.guide', href: '/guide' },
  ]

  it('渲染子内容', () => {
    render(
      <LayoutWithSidebar sidebarMenus={mockItems}>
        <span>主体内容</span>
      </LayoutWithSidebar>,
    )
    expect(screen.getByText('主体内容')).toBeDefined()
  })

  it('渲染 Sidebar 和 MainContent', () => {
    render(
      <LayoutWithSidebar sidebarMenus={mockItems}>
        <span>内容</span>
      </LayoutWithSidebar>,
    )
    expect(screen.getByTestId('sidebar')).toBeDefined()
    expect(screen.getByTestId('main-content')).toBeDefined()
  })
})
