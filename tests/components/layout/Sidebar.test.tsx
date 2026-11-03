import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { LucideProps } from 'lucide-react'
import type { AppLinkProps } from '@/components/app/AppLink'
import { useSidebar, type SidebarContextType } from '@/components/layout/SidebarContext'

vi.mock('@/components/layout/SidebarContext', () => ({
  useSidebar: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: LucideProps) => <span data-testid="chevron-down" className={className} />,
  X: ({ className }: LucideProps) => <span data-testid="x-icon" className={className} />,
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href, className, isActive, onNavigate }: AppLinkProps & { onNavigate?: () => void }) => (
    <a
      href={`${href}`}
      className={className}
      data-active={isActive ? 'true' : 'false'}
      onClick={() => onNavigate?.()}
    >
      {children}
    </a>
  ),
}))

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

const createSidebarHook = (overrides: Partial<SidebarContextType> = {}): SidebarContextType => ({
  items: [
    { titleKey: 'guide-sidebar.guide', href: '/guide' },
    {
      titleKey: 'guide-sidebar.key-concepts',
      items: [
        { titleKey: 'guide-sidebar.overview', href: '/guide/key-concepts/overview' },
        { titleKey: 'guide-sidebar.decks', href: '/guide/decks' },
      ],
    },
  ],
  flattenItems: [],
  mobileOpen: false,
  setMobileOpen: vi.fn(),
  ...overrides,
})

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/unmatched')
  })

  it('渲染桌面端侧边栏', () => {
    vi.mocked(useSidebar).mockReturnValue(createSidebarHook())

    render(<Sidebar />)
    // 桌面侧边栏存在
    const asides = document.querySelectorAll('aside')
    const desktopSidebar = Array.from(asides).find(
      (el) => el.className.includes('hidden md:block'),
    )
    expect(desktopSidebar).toBeDefined()
  })

  it('渲染导航菜单项', () => {
    vi.mocked(useSidebar).mockReturnValue(createSidebarHook())

    render(<Sidebar />)
    expect(screen.getAllByText('guide-sidebar.guide').length).toBeGreaterThan(0)
    expect(screen.getAllByText('guide-sidebar.key-concepts').length).toBeGreaterThan(0)
  })

  it('mobileOpen 为 false 时移动端侧边栏隐藏', async () => {
    vi.mocked(useSidebar).mockReturnValue(
      createSidebarHook({ mobileOpen: false }),
    )

    render(<Sidebar />)
    const asides = document.querySelectorAll('aside')
    const mobileSidebar = Array.from(asides).find(
      (el) => el.className.includes('md:hidden'),
    )
    expect(mobileSidebar?.className).toContain('-translate-x-full')
  })

  it('mobileOpen 为 true 时移动端侧边栏显示', async () => {
    vi.mocked(useSidebar).mockReturnValue(
      createSidebarHook({ mobileOpen: true }),
    )

    render(<Sidebar />)
    const asides = document.querySelectorAll('aside')
    const mobileSidebar = Array.from(asides).find(
      (el) => el.className.includes('md:hidden'),
    )
    expect(mobileSidebar?.className).toContain('translate-x-0')
  })

  it('点击关闭按钮调用 setMobileOpen(false)', async () => {
    const setMobileOpen = vi.fn()
    vi.mocked(useSidebar).mockReturnValue(
      createSidebarHook({ mobileOpen: true, setMobileOpen }),
    )

    render(<Sidebar />)
    const closeButton = screen.getByRole('button', { name: 'Close menu' })
    closeButton.click()
    expect(setMobileOpen).toHaveBeenCalledWith(false)
  })

  it('当前子页面展开分组、高亮链接，并在导航后关闭移动菜单', () => {
    const setMobileOpen = vi.fn()
    vi.mocked(usePathname).mockReturnValue('/guide/key-concepts/overview')
    vi.mocked(useSidebar).mockReturnValue(
      createSidebarHook({ setMobileOpen }),
    )

    render(<Sidebar />)

    const groupButtons = screen.getAllByRole('button', { name: 'guide-sidebar.key-concepts' })
    const group = groupButtons[0].parentElement!
    expect(groupButtons[0].className).toContain('text-accent')
    expect(groupButtons[0].querySelector('[data-testid="chevron-down"]')?.className).toContain('rotate-180')
    expect(group.textContent).toContain('guide-sidebar.overview')

    const overview = screen.getAllByRole('link', { name: 'guide-sidebar.overview' })[0]
    const decks = screen.getAllByRole('link', { name: 'guide-sidebar.decks' })[0]
    expect(overview.className).toContain('bg-accent/10')
    expect(overview.getAttribute('data-active')).toBe('true')
    expect(decks.className).not.toContain('bg-accent/10')
    expect(decks.getAttribute('data-active')).toBe('false')

    fireEvent.click(groupButtons[0])
    expect(group.textContent).not.toContain('guide-sidebar.overview')
    expect(groupButtons[0].querySelector('[data-testid="chevron-down"]')?.className).not.toContain('rotate-180')

    fireEvent.click(groupButtons[0])
    expect(group.textContent).toContain('guide-sidebar.overview')

    fireEvent.click(screen.getAllByRole('link', { name: 'guide-sidebar.overview' })[0])
    expect(setMobileOpen).toHaveBeenCalledWith(false)
  })
})
