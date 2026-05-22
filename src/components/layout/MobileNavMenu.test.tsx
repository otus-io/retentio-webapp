import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { AppLinkProps } from '@/components/app/AppLink'

const mockOnClose = vi.fn()
const mockNavMenu = [
  { title: '指南', href: '/guide', isActive: true },
  { title: '牌组', href: '/decks', isActive: false },
]

vi.mock('@/hooks/useAppNavMenu', () => ({
  default: () => ({ navMenu: mockNavMenu }),
}))

vi.mock('@/components/app/AppLink', () => ({
  default: ({ children, href, onClick, className, isActive, ...props }: AppLinkProps & { onClick?: React.MouseEventHandler }) => (
    <a
      href={`${href}`}
      onClick={onClick}
      className={className}
      data-active={isActive ? 'true' : 'false'}
      {...props}
    >
      {children}
    </a>
  ),
}))

import MobileNavMenu from './MobileNavMenu'

describe('MobileNavMenu', () => {
  it('open 为 true 时渲染导航菜单', () => {
    render(<MobileNavMenu open={true} onClose={mockOnClose} />)
    expect(screen.getByText('指南')).toBeDefined()
    expect(screen.getByText('牌组')).toBeDefined()
  })

  it('open 为 true 时设置 body overflow 为 hidden', () => {
    render(<MobileNavMenu open={true} onClose={mockOnClose} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('open 为 false 时设置 body overflow 为空', () => {
    render(<MobileNavMenu open={false} onClose={mockOnClose} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('open 为 true 时不包含 pointer-events-none 类', () => {
    render(<MobileNavMenu open={true} onClose={mockOnClose} />)
    const aside = document.querySelector('aside')
    expect(aside?.className).not.toContain('pointer-events-none')
  })

  it('open 为 false 时包含 pointer-events-none 类', () => {
    render(<MobileNavMenu open={false} onClose={mockOnClose} />)
    const aside = document.querySelector('aside')
    expect(aside?.className).toContain('pointer-events-none')
  })

  it('点击导航链接时调用 onClose', () => {
    render(<MobileNavMenu open={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText('指南'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('卸载时恢复 body overflow', () => {
    const { unmount } = render(<MobileNavMenu open={true} onClose={mockOnClose} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
