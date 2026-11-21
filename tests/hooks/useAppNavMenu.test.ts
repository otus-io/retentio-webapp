import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useAppNavMenu from '@/hooks/useAppNavMenu'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('useAppNavMenu', () => {
  it('未登录时返回 Guide 和共享卡组菜单项', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/')

    const { result } = renderHook(() => useAppNavMenu())

    expect(result.current.navMenu).toHaveLength(2)
    expect(result.current.navMenu[0]).toMatchObject({
      title: 'nav.guide',
      href: '/guide',
    })
    expect(result.current.navMenu[1]).toMatchObject({
      title: 'term.deck-sharing',
      href: '/decks/shared',
    })
  })

  it('登录后返回 Guide、我的卡组、共享卡组和统计菜单项', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/decks')

    const { result } = renderHook(() => useAppNavMenu({ isLoggedIn: true }))

    expect(result.current.navMenu).toHaveLength(4)
    expect(result.current.navMenu[0]).toMatchObject({
      title: 'nav.guide',
      href: '/guide',
    })
    expect(result.current.navMenu[1]).toMatchObject({
      title: 'nav.my-decks',
      href: '/decks',
      isActive: true,
    })
    expect(result.current.navMenu[2]).toMatchObject({
      title: 'term.deck-sharing',
      href: '/decks/shared',
      isActive: false,
    })
    expect(result.current.navMenu[3]).toMatchObject({
      title: 'statistics.title',
      href: '/statistics',
    })
  })

  it('共享卡组页面只高亮共享卡组', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/decks/shared/abc')

    const { result } = renderHook(() => useAppNavMenu({ isLoggedIn: true }))

    expect(result.current.navMenu[1].isActive).toBe(false)
    expect(result.current.navMenu[2].isActive).toBe(true)
  })

  it('当前路径匹配时 isActive 为 true', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/guide/key-concepts/overview')

    const { result } = renderHook(() => useAppNavMenu({ isLoggedIn: true }))

    expect(result.current.navMenu[0].isActive).toBe(true)
    expect(result.current.navMenu[1].isActive).toBe(false)
  })

  it('当前路径不匹配任何菜单项时 isActive 均为 false', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/profile')

    const { result } = renderHook(() => useAppNavMenu({ isLoggedIn: true }))

    expect(result.current.navMenu[0].isActive).toBe(false)
    expect(result.current.navMenu[1].isActive).toBe(false)
  })
})
