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

  it('默认显示 logo 图片与名称', () => {
    render(<AppLogo />)
    const link = screen.getByRole('link')
    expect(link.querySelector('img[src="/logo.svg"]')).toBeTruthy()
    expect(screen.getByText('Rete')).toBeDefined()
  })

  it('hideName 为 true 时仅显示 logo 图片', () => {
    render(<AppLogo hideName />)
    expect(screen.getByRole('img', { name: 'Rete' })).toBeDefined()
    expect(screen.queryByText('Rete')).toBeNull()
  })
})
