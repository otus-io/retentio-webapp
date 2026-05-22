import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import AppLogo from './AppLogo'

vi.mock('@/config', () => ({
  APP_NAME: 'Retentio',
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

  it('默认显示 APP_NAME', () => {
    render(<AppLogo />)
    expect(screen.getByText('Retentio')).toBeDefined()
  })

  it('hideName 为 true 时隐藏名称', () => {
    render(<AppLogo hideName />)
    expect(screen.queryByText('Retentio')).toBeNull()
  })
})
