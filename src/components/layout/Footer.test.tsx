import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { LucideProps } from 'lucide-react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      tagline: 'Remember More, For Longer',
      privacy: '隐私政策',
      terms: '服务条款',
      contact: '联系我们',
    }
    return map[key] || key
  },
}))

vi.mock('@heroui/react', () => ({
  Link: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>{children}</a>
  ),
  Separator: ({ className }: { className?: string }) => <hr className={className} />,
}))

vi.mock('lucide-react', () => ({
  Layers: ({ className }: LucideProps) => <span data-testid="layers-icon" className={className} />,
}))

import Footer from './Footer'

describe('Footer', () => {
  it('渲染 APP_NAME', () => {
    render(<Footer />)
    expect(screen.getByText('Rete')).toBeDefined()
  })

  it('渲染标语', () => {
    render(<Footer />)
    expect(screen.getByText('Remember More, For Longer')).toBeDefined()
  })

  it('渲染版权年份', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeDefined()
  })

  it('渲染隐私政策、服务条款、联系我们链接', () => {
    render(<Footer />)
    expect(screen.getByText('隐私政策')).toBeDefined()
    expect(screen.getByText('服务条款')).toBeDefined()
    expect(screen.getByText('联系我们')).toBeDefined()
  })

  it('渲染 Layers 图标', () => {
    render(<Footer />)
    expect(screen.getByTestId('layers-icon')).toBeDefined()
  })
})
