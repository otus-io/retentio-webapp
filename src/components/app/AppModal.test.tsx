import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'

afterEach(() => {
  cleanup()
})

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'common.cancel': '取消',
      'common.confirm': '确认',
    }
    return map[key] || key
  },
}))

vi.mock('@heroui/react', () => ({
  Modal: Object.assign(
    ({ children }: ComponentProps<'div'>) => <>{children}</>,
    {
      Backdrop: ({ children, isOpen, onOpenChange, ...rest }: ComponentProps<'div'> & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }) => (
        isOpen ? <div data-testid="modal-backdrop" data-onopenchange={String(!!onOpenChange)} {...rest}>{children}</div> : null
      ),
      Container: (props: ComponentProps<'div'>) => <div data-testid="modal-container" {...props} />,
      Dialog: (props: ComponentProps<'div'>) => <div data-testid="modal-dialog" {...props} />,
      CloseTrigger: (props: ComponentProps<'button'>) => <button data-testid="modal-close-trigger" {...props}>X</button>,
      Header: (props: ComponentProps<'div'>) => <div data-testid="modal-header" {...props} />,
      Heading: (props: ComponentProps<'h2'>) => <h2 data-testid="modal-heading" {...props} />,
      Body: (props: ComponentProps<'div'>) => <div data-testid="modal-body" {...props} />,
      Footer: (props: ComponentProps<'div'>) => <div data-testid="modal-footer" {...props} />,
    },
  ),
}))

vi.mock('@/components/app/AppButton', () => ({
  default: ({ children, variant, onClick }: ComponentProps<'button'> & { variant?: string }) => (
    <button data-testid={`btn-${variant}`} onClick={onClick}>{children}</button>
  ),
}))

import AppModal from './AppModal'

describe('AppModal', () => {
  const baseProps = {
    isOpen: true,
    open: vi.fn(),
    setOpen: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  }

  it('isOpen 为 true 时渲染', () => {
    render(<AppModal {...baseProps} title="确认操作"><p>确认删除吗？</p></AppModal>)
    expect(screen.getByTestId('modal-backdrop')).toBeDefined()
  })

  it('isOpen 为 false 时不渲染', () => {
    const { container } = render(<AppModal {...baseProps} isOpen={false} title="确认操作"><p>确认删除吗？</p></AppModal>)
    expect(container.querySelector('[data-testid="modal-backdrop"]')).toBeNull()
  })

  it('渲染 title', () => {
    render(<AppModal {...baseProps} title="确认操作"><p>确认删除吗？</p></AppModal>)
    expect(screen.getByText('确认操作')).toBeDefined()
  })

  it('渲染子内容', () => {
    render(<AppModal {...baseProps} title="提示"><p>确认删除吗？</p></AppModal>)
    expect(screen.getByText('确认删除吗？')).toBeDefined()
  })

  it('点击确认按钮调用 close 和 onComfirm', () => {
    const close = vi.fn()
    const onComfirm = vi.fn()
    render(<AppModal {...baseProps} close={close} onComfirm={onComfirm} title="提示"><p>test</p></AppModal>)
    fireEvent.click(screen.getByText('确认'))
    expect(close).toHaveBeenCalled()
    expect(onComfirm).toHaveBeenCalled()
  })

  it('点击取消按钮调用 close 和 onCancel', () => {
    const close = vi.fn()
    const onCancel = vi.fn()
    render(<AppModal {...baseProps} close={close} onCancel={onCancel} title="提示"><p>test</p></AppModal>)
    fireEvent.click(screen.getByText('取消'))
    expect(close).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('footer=false 时不渲染 footer', () => {
    render(<AppModal {...baseProps} title="提示" footer={false}><p>test</p></AppModal>)
    expect(screen.queryByTestId('modal-footer')).toBeNull()
  })
})
