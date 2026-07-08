import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import AppLogo from './AppLogo'

vi.mock('@/config', () => ({
  APP_NAME: 'Rete',
}))

vi.mock('@/components/app/AppLink', () => ({
  default: (props: ComponentProps<'a'> & { children?: ReactNode }) => (
    <a {...props}>{props.children}</a>
  ),
}))

describe('AppLogo', () => {
  it('渲染链接到首页', () => {
    render(<AppLogo />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/')
  })

  it('logo 作为首字母，仅显示其余字母', () => {
    render(<AppLogo />)
    expect(screen.getByText('ete')).toBeDefined()
    expect(screen.queryByText('Rete')).toBeNull()
  })

  it('链接的无障碍名称为完整 APP_NAME', () => {
    render(<AppLogo />)
    expect(screen.getByRole('link').getAttribute('aria-label')).toBe('Rete')
  })

  it('渲染 logo 图片', () => {
    const { container } = render(<AppLogo />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('/logo.svg')
  })
})
