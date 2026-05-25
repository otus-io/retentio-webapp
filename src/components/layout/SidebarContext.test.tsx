import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { SidebarProvider, useSidebar } from './SidebarContext'
import type { SidebarNavItem } from '@/config/sidebar'

const mockItems: SidebarNavItem[] = [
  { titleKey: 'guide-sidebar.guide', href: '/guide' },
  {
    titleKey: 'guide-sidebar.key-concepts',
    items: [
      { titleKey: 'guide-sidebar.overview', href: '/guide/key-concepts/overview' },
      { titleKey: 'guide-sidebar.decks', href: '/guide/decks' },
    ],
  },
]

function Consumer() {
  const { items, flattenItems, mobileOpen, setMobileOpen } = useSidebar()
  return (
    <div>
      <span data-testid="itemCount">{items.length}</span>
      <span data-testid="flattenCount">{flattenItems.length}</span>
      <span data-testid="mobileOpen">{String(mobileOpen)}</span>
      <button data-testid="toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        切换
      </button>
    </div>
  )
}

describe('SidebarContext', () => {
  it('在 Provider 内提供 items', () => {
    render(
      <SidebarProvider items={mockItems}>
        <Consumer />
      </SidebarProvider>,
    )
    expect(screen.getByTestId('itemCount').textContent).toBe('2')
  })

  it('flattenItems 扁平化嵌套菜单项，排除无 href 的分组和空子项', () => {
    render(
      <SidebarProvider items={mockItems}>
        <Consumer />
      </SidebarProvider>,
    )
    // /guide, /guide/key-concepts/overview, /guide/decks = 3
    expect(screen.getByTestId('flattenCount').textContent).toBe('3')
  })

  it('mobileOpen 默认为 false', () => {
    render(
      <SidebarProvider items={mockItems}>
        <Consumer />
      </SidebarProvider>,
    )
    expect(screen.getByTestId('mobileOpen').textContent).toBe('false')
  })

  it('setMobileOpen 可切换 mobileOpen', async () => {
    render(
      <SidebarProvider items={mockItems}>
        <Consumer />
      </SidebarProvider>,
    )
    const button = screen.getByTestId('toggle')
    await act(async () => {
      button.click()
    })
    expect(screen.getByTestId('mobileOpen').textContent).toBe('true')
  })

  it('在 Provider 外部使用 useSidebar 抛出错误', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useSidebar must be used within SidebarProvider',
    )
  })

  it('flattenItems 过滤掉没有 href 的叶子节点', () => {
    const itemsWithNoHref: SidebarNavItem[] = [
      { titleKey: 'guide-sidebar.guide' },
      { titleKey: 'guide-sidebar.key-concepts', href: '/guide/start' },
    ]
    render(
      <SidebarProvider items={itemsWithNoHref}>
        <Consumer />
      </SidebarProvider>,
    )
    expect(screen.getByTestId('flattenCount').textContent).toBe('1')
  })
})

describe('useSidebar (hook)', () => {
  it('返回 context 值', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SidebarProvider items={mockItems}>{children}</SidebarProvider>
    )
    const { result } = renderHook(() => useSidebar(), { wrapper })
    expect(result.current.items).toBe(mockItems)
    expect(result.current.mobileOpen).toBe(false)
    expect(result.current.flattenItems).toHaveLength(3)
  })
})
