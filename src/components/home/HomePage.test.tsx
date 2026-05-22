import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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
  Languages: () => <span data-testid="icon-languages" />,
  Brain: () => <span data-testid="icon-brain" />,
  Palette: () => <span data-testid="icon-palette" />,
  Bot: () => <span data-testid="icon-bot" />,
  ArrowDown: () => <span data-testid="icon-arrow-down" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Clock: () => <span data-testid="icon-clock" />,
  BookOpen: () => <span data-testid="icon-book-open" />,
  TrendingUp: () => <span data-testid="icon-trending-up" />,
  Download: () => <span data-testid="icon-download" />,
  Book: () => <span data-testid="icon-book" />,
}))

import HomePage from './HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', vi.fn(function (
      this: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> },
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {
      this.observe = vi.fn()
      this.disconnect = vi.fn()
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
    expect(screen.getByText('nav.guide')).toBeDefined()
    expect(screen.getByText('home.hero.learnMore')).toBeDefined()
  })

  it('渲染特性区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.features.sectionTitle')).toBeDefined()
    expect(screen.getByText('home.features.verified.title')).toBeDefined()
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

  it('渲染 CTA 下载区域', () => {
    render(<HomePage />)
    expect(screen.getByText('home.cta.title')).toBeDefined()
    expect(screen.getByText('home.cta.subtitle')).toBeDefined()
    expect(screen.getByText('home.cta.button')).toBeDefined()
  })

  it('下载链接指向 App Store', () => {
    render(<HomePage />)
    const link = screen.getByText('home.cta.button').closest('a')
    expect(link?.getAttribute('href')).toBe('https://apps.apple.com')
    expect(link?.getAttribute('target')).toBe('_blank')
  })

  it('渲染导航按钮指向 /guide', () => {
    render(<HomePage />)
    const guideLink = screen.getByText('nav.guide').closest('a')
    expect(guideLink?.getAttribute('href')).toBe('/guide')
  })

  it('AnimatedSection 初始状态为不可见', () => {
    render(<HomePage />)
    const titles = screen.getAllByText('home.features.sectionTitle')
    const container = titles[0].closest('div')
    expect(container?.className).toContain('opacity-0')
  })
})
