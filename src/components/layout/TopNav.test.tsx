import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type MobileMenuButton from './MobileMenuButton'
import type MobileNavMenu from './MobileNavMenu'
import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'

vi.mock('@/hooks/useAppNavMenu', () => ({
  default: () => ({
    navMenu: [
      { title: '指南', href: '/guide', isActive: true },
      { title: '牌组', href: '/decks', isActive: false },
    ],
  }),
}))

vi.mock('@/components/layout/LocaleSwitcher', () => ({
  default: () => <button data-testid="locale-switcher">语言</button>,
}))

vi.mock('@/components/layout/ThemeButton', () => ({
  default: () => <button data-testid="theme-button">主题</button>,
}))

vi.mock('@/components/layout/MobileMenuButton', () => ({
  default: ({ open, onToggle }: ComponentProps<typeof MobileMenuButton>) => (
    <button data-testid="mobile-menu-button" data-open={open} onClick={onToggle}>
      菜单
    </button>
  ),
}))

vi.mock('@/components/layout/MobileNavMenu', () => ({
  default: ({ open, onClose }: ComponentProps<typeof MobileNavMenu>) =>
    open
      ? (
        <div data-testid="mobile-nav-menu">
          <button data-testid="mobile-nav-close" onClick={onClose}>
            关闭
          </button>
        </div>
      )
      : null,
}))

vi.mock('@/components/auth/UserButton', () => ({
  default: ({ user }: { user?: ProfileResponseDTO | null }) => (
    <button data-testid="user-button">{user ? user.username : '登录'}</button>
  ),
}))

vi.mock('@/components/app/AppLogo', () => ({
  default: () => <span data-testid="app-logo">Logo</span>,
}))

vi.mock('@/components/app/AppButtonLink', () => ({
  AppButtonLink: ({ children, href, variant, style }: ComponentProps<'a'> & { variant?: string }) => (
    <a data-testid={`nav-link-${href}`} href={href} data-variant={variant} style={style}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/guide/GuideSearchButton', () => ({
  default: () => <button data-testid="guide-search-button">搜索</button>,
}))

import TopNav from './TopNav'

describe('TopNav', () => {
  it('渲染 AppLogo', () => {
    render(<TopNav />)
    expect(screen.getByTestId('app-logo')).toBeDefined()
  })

  it('渲染桌面端导航菜单链接', () => {
    render(<TopNav />)
    const guideLink = screen.getByTestId('nav-link-/guide')
    expect(guideLink).toBeDefined()
    expect(guideLink.getAttribute('data-variant')).toBe('primary')
    expect(guideLink.textContent).toBe('指南')
  })

  it('渲染 LocaleSwitcher、ThemeButton', () => {
    render(<TopNav />)
    expect(screen.getByTestId('locale-switcher')).toBeDefined()
    expect(screen.getByTestId('theme-button')).toBeDefined()
  })

  it('渲染 GuideSearchButton', () => {
    render(<TopNav />)
    expect(screen.getByTestId('guide-search-button')).toBeDefined()
  })

  it('渲染 UserButton', () => {
    render(<TopNav user={{ username: 'testuser' } as ProfileResponseDTO} />)
    expect(screen.getByTestId('user-button')).toBeDefined()
    expect(screen.getByText('testuser')).toBeDefined()
  })

  it('未登录时渲染 UserButton 无用户名', () => {
    render(<TopNav user={null} />)
    expect(screen.getByTestId('user-button')).toBeDefined()
    expect(screen.getByText('登录')).toBeDefined()
  })

  it('默认状态下不显示 MobileNavMenu', () => {
    render(<TopNav />)
    expect(screen.queryByTestId('mobile-nav-menu')).toBeNull()
  })

  it('点击 MobileMenuButton 后显示 MobileNavMenu', () => {
    render(<TopNav />)
    const menuButton = screen.getByTestId('mobile-menu-button')
    expect(menuButton.getAttribute('data-open')).toBe('false')

    fireEvent.click(menuButton)
    expect(screen.getByTestId('mobile-nav-menu')).toBeDefined()
  })

  it('在 MobileNavMenu 中点击关闭后隐藏', () => {
    render(<TopNav />)
    fireEvent.click(screen.getByTestId('mobile-menu-button'))
    expect(screen.getByTestId('mobile-nav-menu')).toBeDefined()

    fireEvent.click(screen.getByTestId('mobile-nav-close'))
    expect(screen.queryByTestId('mobile-nav-menu')).toBeNull()
  })
})
