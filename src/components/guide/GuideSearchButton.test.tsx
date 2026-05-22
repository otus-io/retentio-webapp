import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GuideSearchButton from './GuideSearchButton'

const openMock = vi.fn()
const setOpenMock = vi.fn()

vi.mock('@heroui/react', () => ({
  Button: ({ children, onPress, ...props }: {
    children?: React.ReactNode
    onPress?: () => void
    [key: string]: unknown
  }) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
  useOverlayState: () => ({
    isOpen: false,
    open: openMock,
    close: vi.fn(),
    setOpen: setOpenMock,
  }),
}))

vi.mock('lucide-react', () => ({
  Search: ({ size }: { size?: number }) => <span data-testid="search-icon" data-size={size} />,
}))

vi.mock('@/components/guide/GuideSearchModal', () => ({
  default: ({ isOpen }: { isOpen: boolean; onOpenChange: (v: boolean) => void }) =>
    isOpen ? <div data-testid="search-modal" /> : null,
}))

describe('GuideSearchButton', () => {
  it('渲染搜索按钮', () => {
    render(<GuideSearchButton />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDefined()
    expect(btn.getAttribute('aria-label')).toBe('Search')
  })

  it('渲染搜索图标', () => {
    render(<GuideSearchButton />)
    expect(screen.getByTestId('search-icon')).toBeDefined()
  })

  it('点击按钮调用 open', () => {
    render(<GuideSearchButton />)
    fireEvent.click(screen.getByRole('button'))
    expect(openMock).toHaveBeenCalled()
  })

  it('模态框初始时为关闭状态', () => {
    render(<GuideSearchButton />)
    expect(screen.queryByTestId('search-modal')).toBeNull()
  })
})
