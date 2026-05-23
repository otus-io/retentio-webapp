import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { ButtonVariants } from '@heroui/react'

vi.mock('@heroui/react', () => ({
  buttonVariants: (opts: ButtonVariants) => {
    const classes = []
    if (opts?.fullWidth) classes.push('w-full')
    if (opts?.isIconOnly) classes.push('icon-only')
    if (opts?.size) classes.push(`size-${opts.size}`)
    if (opts?.variant) classes.push(`variant-${opts.variant}`)
    return classes.join(' ')
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, className, ...rest }: ComponentProps<'a'>) => (
    <a className={className} {...rest}>{children}</a>
  ),
}))

import { AppButtonLink } from './AppButtonLink'

describe('AppButtonLink', () => {
  it('渲染子元素和 href', () => {
    render(<AppButtonLink href="/about">关于我们</AppButtonLink>)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/about')
    expect(screen.getByText('关于我们')).toBeDefined()
  })

  it('应用 buttonVariants 样式类', () => {
    render(<AppButtonLink href="/" variant="primary" size="lg">按钮</AppButtonLink>)
    const link = screen.getByRole('link')
    expect(link.className).toContain('variant-primary')
    expect(link.className).toContain('size-lg')
  })
})
