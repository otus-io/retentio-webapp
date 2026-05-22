import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { LucideProps } from 'lucide-react'
import type { SidebarContextType } from '@/components/layout/SidebarContext'

const mockSetMobileOpen = vi.fn()

vi.mock('@/components/layout/SidebarContext', () => ({
  useSidebar: (): SidebarContextType => ({
    setMobileOpen: mockSetMobileOpen,
    items: [],
    flattenItems: [],
    mobileOpen: false,
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'guide-sidebar.menu': '菜单',
    }
    return map[key] || key
  },
}))

vi.mock('@/components/layout/DocNavigation', () => ({
  default: () => <nav data-testid="doc-navigation">文档导航</nav>,
}))

vi.mock('lucide-react', () => ({
  Menu: ({ className }: LucideProps) => <span data-testid="menu-icon" className={className} />,
}))

import MainContent from './MainContent'

describe('MainContent', () => {
  it('渲染子内容', () => {
    render(<MainContent><span>主体内容</span></MainContent>)
    expect(screen.getByText('主体内容')).toBeDefined()
  })

  it('渲染移动端菜单按钮', () => {
    render(<MainContent><span>内容</span></MainContent>)
    expect(screen.getByText('菜单')).toBeDefined()
    expect(screen.getByTestId('menu-icon')).toBeDefined()
  })

  it('点击菜单按钮调用 setMobileOpen(true)', () => {
    render(<MainContent><span>内容</span></MainContent>)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetMobileOpen).toHaveBeenCalledWith(true)
  })

  it('isNavVisible 为 true 时渲染 DocNavigation', () => {
    render(<MainContent isNavVisible={true}><span>内容</span></MainContent>)
    expect(screen.getByTestId('doc-navigation')).toBeDefined()
  })

  it('isNavVisible 为 false 时不渲染 DocNavigation', () => {
    render(<MainContent isNavVisible={false}><span>内容</span></MainContent>)
    expect(screen.queryByTestId('doc-navigation')).toBeNull()
  })
})
