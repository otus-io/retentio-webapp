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
  it('返回 navMenu 数组', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/decks')

    const { result } = renderHook(() => useAppNavMenu())

    expect(result.current.navMenu).toHaveLength(2)
    expect(result.current.navMenu[0]).toMatchObject({
      title: 'nav.guide',
      href: '/guide',
    })
    expect(result.current.navMenu[1]).toMatchObject({
      title: 'term.decks',
      href: '/decks',
    })
  })

  it('当前路径匹配时 isActive 为 true', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/guide/getting-started')

    const { result } = renderHook(() => useAppNavMenu())

    expect(result.current.navMenu[0].isActive).toBe(true)
    expect(result.current.navMenu[1].isActive).toBe(false)
  })

  it('当前路径不匹配任何菜单项时 isActive 均为 false', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/profile')

    const { result } = renderHook(() => useAppNavMenu())

    expect(result.current.navMenu[0].isActive).toBe(false)
    expect(result.current.navMenu[1].isActive).toBe(false)
  })
})
