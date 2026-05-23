import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileMenuButton from './MobileMenuButton'

describe('MobileMenuButton', () => {
  it('关闭状态时显示 Open menu 并渲染两条横线', () => {
    render(<MobileMenuButton open={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined()
    const spans = document.querySelectorAll('span.block')
    expect(spans).toHaveLength(2)
    expect(spans[0].className).not.toContain('rotate-45')
    expect(spans[1].className).not.toContain('-rotate-45')
  })

  it('打开状态时显示 Close menu 并带有旋转动画类', () => {
    render(<MobileMenuButton open={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeDefined()
    const spans = document.querySelectorAll('span.block')
    expect(spans[0].className).toContain('rotate-45')
    expect(spans[1].className).toContain('-rotate-45')
  })

  it('点击时调用 onToggle', () => {
    const onToggle = vi.fn()
    render(<MobileMenuButton open={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
