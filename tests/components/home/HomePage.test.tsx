import type * as ReactNamespace from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'

const homeFlags = vi.hoisted(() => ({
  hideHighlight: false,
  nullSectionRef: false,
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof ReactNamespace>('react')
  return {
    ...actual,
    useRef: (initial: unknown) => {
      if (homeFlags.nullSectionRef) {
        const ref = { current: null as unknown }
        Object.defineProperty(ref, 'current', {
          configurable: true,
          enumerable: true,
          get: () => null,
          set: () => {},
        })
        return ref
      }
      return actual.useRef(initial)
    },
  }
})

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (
    homeFlags.hideHighlight && key === 'home.hero.titleHighlight' ? '' : key
  ),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: {
    children: React.ReactNode
    href: string
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

vi.mock('@heroui/react', () => ({
  Button: ({ children, ...props }: {
    children?: React.ReactNode | ((renderProps: { isPending?: boolean }) => React.ReactNode)
    [key: string]: unknown
  }) => {
    const resolved = typeof children === 'function' ? children({ isPending: false }) : children
    return <button {...props}>{resolved}</button>
  },
  buttonVariants: () => '',
  Spinner: () => <span data-testid="spinner" />,
}))

vi.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-users" />,
  Brain: () => <span data-testid="icon-brain" />,
  Palette: () => <span data-testid="icon-palette" />,
  Bot: () => <span data-testid="icon-bot" />,
  ArrowDown: () => <span data-testid="icon-arrow-down" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Clock: () => <span data-testid="icon-clock" />,
  BookOpen: () => <span data-testid="icon-book-open" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
}))

import { PLAY_STORE_URL, TESTFLIGHT_JOIN_URL } from '@/config'
import HomePage from '@/components/home/HomePage'

interface ObserverStub {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

describe('HomePage', () => {
  const observers: ObserverStub[] = []

  beforeEach(() => {
    observers.length = 0
    homeFlags.hideHighlight = false
    homeFlags.nullSectionRef = false
    vi.stubGlobal('IntersectionObserver', vi.fn(function (
      this: ObserverStub,
      callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {
      this.callback = callback
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      observers.push(this)
    }))
  })

  it('渲染英雄区域标题和副标题', () => {
    render(<HomePage />)
    expect(screen.getByText('home.hero.title')).toBeDefined()
    expect(screen.getByText('home.hero.titleHighlight')).toBeDefined()
    expect(screen.getByText('home.hero.subtitle')).toBeDefined()
  })

  it('渲染英雄区域 CTA 按钮', () => {
    render(<HomePage />)
    expect(screen.getByText('home.hero.learnMore')).toBeDefined()
  })

  it('渲染下载区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.cta.title')).toBeDefined()
    expect(screen.getByText('home.cta.subtitle')).toBeDefined()
    expect(screen.getByText('home.cta.button')).toBeDefined()
    expect(screen.getByText('home.cta.androidButton')).toBeDefined()
    expect(screen.getByText('home.cta.note')).toBeDefined()
  })

  it('渲染特性区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.features.sectionTitle')).toBeDefined()
    expect(screen.getByText('home.features.community.title')).toBeDefined()
    expect(screen.getByText('home.features.algorithm.title')).toBeDefined()
    expect(screen.getByText('home.features.ui.title')).toBeDefined()
    expect(screen.getByText('home.features.ai.title')).toBeDefined()
  })

  it('渲染如何使用区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.howItWorks.sectionTitle')).toBeDefined()
    expect(screen.getByText('home.howItWorks.step1.title')).toBeDefined()
    expect(screen.getByText('home.howItWorks.step2.title')).toBeDefined()
    expect(screen.getByText('home.howItWorks.step3.title')).toBeDefined()
    expect(screen.getByText('home.howItWorks.readMore')).toBeDefined()
  })

  it('渲染关于区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.about.title')).toBeDefined()
    expect(screen.getByText('home.about.description')).toBeDefined()
  })

  it('下载链接指向 TestFlight 与 Google Play', () => {
    render(<HomePage />)
    const iosLink = screen.getByText('home.cta.button').closest('a')
    expect(iosLink?.getAttribute('href')).toBe(TESTFLIGHT_JOIN_URL)
    expect(iosLink?.getAttribute('target')).toBe('_blank')
    const androidLink = screen.getByText('home.cta.androidButton').closest('a')
    expect(androidLink?.getAttribute('href')).toBe(PLAY_STORE_URL)
    expect(androidLink?.getAttribute('target')).toBe('_blank')
  })

  it('Learn More 链接指向背景介绍', () => {
    render(<HomePage />)
    const learnMoreLink = screen.getByText('home.hero.learnMore').closest('a')
    expect(learnMoreLink?.getAttribute('href')).toBe('/guide/background/what-is-retentio')
  })

  it('AnimatedSection 初始状态为不可见', () => {
    render(<HomePage />)
    const titles = screen.getAllByText('home.features.sectionTitle')
    const container = titles[0].closest('div')
    expect(container?.className).toContain('opacity-0')
  })

  it('进入视口后显示，未相交时保持隐藏', () => {
    render(<HomePage />)
    const section = screen.getByText('home.about.title').closest('div')
    expect(section?.className).toContain('opacity-0')
    expect(IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '-80px' },
    )

    act(() => {
      for (const observer of observers) {
        observer.callback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          observer as unknown as IntersectionObserver,
        )
      }
    })
    expect(section?.className).toContain('opacity-0')
    expect(observers[0].disconnect).not.toHaveBeenCalled()

    act(() => {
      for (const observer of observers) {
        observer.callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          observer as unknown as IntersectionObserver,
        )
      }
    })
    expect(section?.className).toContain('opacity-100')
    expect(section?.className).not.toContain('opacity-0')
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('标题高亮为空时不渲染强调文本', () => {
    homeFlags.hideHighlight = true
    render(<HomePage />)
    expect(screen.getByText('home.hero.title')).toBeDefined()
    expect(screen.queryByText('home.hero.titleHighlight')).toBeNull()
  })

  it('区块节点尚未挂载时不创建观察器', () => {
    homeFlags.nullSectionRef = true
    render(<HomePage />)
    expect(observers).toHaveLength(0)
    expect(screen.getByText('home.about.title').closest('div')?.className).toContain('opacity-0')
  })
})
