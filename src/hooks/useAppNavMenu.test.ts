import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useAppNavMenu from './useAppNavMenu'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('useAppNavMenu', () => {
  it('未登录时只返回 Guide 菜单项', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/')

    const { result } = renderHook(() => useAppNavMenu())

    expect(result.current.navMenu).toHaveLength(1)
    expect(result.current.navMenu[0]).toMatchObject({
      title: 'nav.guide',
      href: '/guide',
    })
  })

  it('登录后返回 Guide 和 Decks 菜单项', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/decks')

    const { result } = renderHook(() => useAppNavMenu({ isLoggedIn: true }))

    expect(result.current.navMenu).toHaveLength(3)
    expect(result.current.navMenu[0]).toMatchObject({
      title: 'nav.guide',
      href: '/guide',
    })
    expect(result.current.navMenu[1]).toMatchObject({
      title: 'term.decks',
      href: '/decks',
    })
    expect(result.current.navMenu[2]).toMatchObject({
      title: 'term.tags',
      href: '/tags',
    })
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
