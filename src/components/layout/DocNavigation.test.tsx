import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/layout/SidebarContext', () => ({
  useSidebar: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('@/utils/string', () => ({
  normalizePath: (path: string) => path.replace(/\/$/, '').replace(/\/index$/, ''),
}))

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: LucideProps) => <span data-testid="chevron-down" className={className} />,
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href, className }: AppLinkProps) => (
    <a href={`${href}`} className={className}>{children}</a>
  ),
}))

import { useSidebar, type SidebarContextType } from '@/components/layout/SidebarContext'
import { usePathname } from 'next/navigation'
import type { SidebarNavItem } from '@/config/sidebar'
import DocNavigation from './DocNavigation'
import type { LucideProps } from 'lucide-react'
import type { AppLinkProps } from '@/components/app/AppLink'

const createFlattenItems = (): SidebarNavItem[] => [
  { titleKey: 'guide-sidebar.guide', href: '/guide' },
  { titleKey: 'guide-sidebar.key-concepts', href: '/guide/key-concepts' },
  { titleKey: 'guide-sidebar.decks', href: '/guide/decks' },
]

describe('DocNavigation', () => {
  it('当前在中间页面时同时渲染上一篇和下一篇', () => {
    vi.mocked(useSidebar).mockReturnValue({
      flattenItems: createFlattenItems(),
    } as SidebarContextType)
    vi.mocked(usePathname).mockReturnValue('/guide/key-concepts')

    render(<DocNavigation />)
    expect(screen.getByText('content.previous')).toBeDefined()
    expect(screen.getByText('content.next')).toBeDefined()
    expect(screen.getByText('guide-sidebar.guide')).toBeDefined()
    expect(screen.getByText('guide-sidebar.decks')).toBeDefined()
  })

  it('当前在第一页时只渲染下一篇', () => {
    vi.mocked(useSidebar).mockReturnValue({
      flattenItems: createFlattenItems(),
    } as SidebarContextType)
    vi.mocked(usePathname).mockReturnValue('/guide')

    render(<DocNavigation />)
    expect(screen.queryByText('content.previous')).toBeNull()
    expect(screen.getByText('content.next')).toBeDefined()
  })

  it('当前在最后一页时只渲染上一篇', () => {
    vi.mocked(useSidebar).mockReturnValue({
      flattenItems: createFlattenItems(),
    } as SidebarContextType)
    vi.mocked(usePathname).mockReturnValue('/guide/decks')

    render(<DocNavigation />)
    expect(screen.getByText('content.previous')).toBeDefined()
    expect(screen.queryByText('content.next')).toBeNull()
  })

  it('flattenItems 只有一项时不渲染任何导航', () => {
    vi.mocked(useSidebar).mockReturnValue({
      flattenItems: [{ titleKey: 'guide-sidebar.guide', href: '/guide' }],
    } as SidebarContextType)
    vi.mocked(usePathname).mockReturnValue('/guide')

    render(<DocNavigation />)
    expect(screen.queryByText('content.previous')).toBeNull()
    expect(screen.queryByText('content.next')).toBeNull()
  })

  it('通过 normalizePath 匹配当前路径', () => {
    vi.mocked(useSidebar).mockReturnValue({
      flattenItems: createFlattenItems(),
    } as SidebarContextType)
    vi.mocked(usePathname).mockReturnValue('/guide/key-concepts/index')

    render(<DocNavigation />)
    // 匹配到 /guide/key-concepts，上一篇是 /guide
    expect(screen.getByText('content.previous')).toBeDefined()
    expect(screen.getByText('guide-sidebar.guide')).toBeDefined()
  })
})
