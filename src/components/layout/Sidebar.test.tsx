import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  default: ({ children, href, className, isActive }: AppLinkProps & { onNavigate?: () => void }) => (
    <a href={`${href}`} className={className} data-active={isActive ? 'true' : 'false'}>
      {children}
    </a>
  ),
}))

import Sidebar from './Sidebar'

const createSidebarHook = (overrides: Partial<SidebarContextType> = {}): SidebarContextType => ({
  items: [
    { titleKey: 'guide-sidebar.guide', href: '/guide' },
    {
      titleKey: 'guide-sidebar.getting-started',
      items: [
        { titleKey: 'guide-sidebar.key-concepts', href: '/guide/key-concepts' },
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
    expect(screen.getAllByText('guide-sidebar.getting-started').length).toBeGreaterThan(0)
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
})
