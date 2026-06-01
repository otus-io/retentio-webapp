import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeleteModal from './DeleteModal'

const mockSetIsOpen = vi.fn()

vi.mock('@heroui/react', () => ({
  AlertDialog: {
    Backdrop: ({ children, isOpen }: { children?: React.ReactNode; isOpen?: boolean }) =>
      isOpen ? <div role="dialog">{children}</div> : null,
    Container: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Dialog: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    CloseTrigger: () => <button aria-label="Close">×</button>,
    Header: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Icon: ({ status }: { status?: string }) => <span data-testid={`icon-${status}`} />,
    Heading: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
    Body: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Footer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, slot, variant, type }: {
    children?: React.ReactNode
    slot?: string
    variant?: string
    type?: string
    isPending?: boolean
  }) => (
    <button type={type === 'submit' ? 'submit' : 'button'} data-variant={variant} data-slot={slot}>
      {children}
    </button>
  ),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: { count?: number }) => {
    const map: Record<string, string> = {
      'common.tips': '提示',
      'common.delete-confirm-single': '确认删除？',
      'common.delete-confirm-multiple': `确认删除 ${params?.count ?? 0} 项？`,
      'common.cancel': '取消',
      'common.confirm': '确认',
    }
    return map[key] || key
  },
}))

const mockAction = vi.fn()

describe('DeleteModal', () => {
  const defaultProps = {
    action: mockAction,
    isOpen: true,
    setIsOpen: mockSetIsOpen,
  }

  it('isOpen 为 true 时渲染对话框', () => {
    render(<DeleteModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('isOpen 为 false 时不渲染', () => {
    render(<DeleteModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('显示确认删除文案', () => {
    render(<DeleteModal {...defaultProps} />)
    expect(screen.getByText('确认删除？')).toBeDefined()
  })

  it('type 为 multiple 时显示多条删除确认文案', () => {
    render(<DeleteModal {...defaultProps} type="multiple" deleteCount={5} />)
    expect(screen.getByText(/5/)).toBeDefined()
  })

  it('type 为 single 时显示单条删除确认文案', () => {
    render(<DeleteModal {...defaultProps} type="single" />)
    expect(screen.getByText('确认删除？')).toBeDefined()
  })

  it('默认使用 single 类型', () => {
    render(<DeleteModal {...defaultProps} />)
    expect(screen.getByText('确认删除？')).toBeDefined()
  })

  it('渲染取消和确认按钮', () => {
    render(<DeleteModal {...defaultProps} />)
    expect(screen.getByText('取消')).toBeDefined()
    expect(screen.getByText('确认')).toBeDefined()
  })

  it('确认按钮类型为 submit', () => {
    render(<DeleteModal {...defaultProps} />)
    const confirmBtn = screen.getByText('确认')
    expect(confirmBtn.getAttribute('type')).toBe('submit')
  })

  it('渲染关闭按钮', () => {
    render(<DeleteModal {...defaultProps} />)
    expect(screen.getByLabelText('Close')).toBeDefined()
  })
})
