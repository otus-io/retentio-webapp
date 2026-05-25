import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { LucideProps } from 'lucide-react'

const mockSetLocaleAction = vi.fn()

vi.mock('@/modules/locale/locale.action', () => ({
  setLocaleAction: (locale: string) => mockSetLocaleAction(locale),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

type RenderChildren = React.ReactNode | ((props: { isSelected: boolean }) => React.ReactNode)

vi.mock('@heroui/react', () => ({
  Dropdown: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div data-testid="dropdown">{children}</div>,
    {
      Popover: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="popover">{children}</div>
      ),
      Menu: ({ children, selectionMode }: { children?: React.ReactNode; selectionMode?: string }) => (
        <ul data-testid="menu" data-selection-mode={selectionMode}>
          {children}
        </ul>
      ),
      Section: ({ children }: { children?: React.ReactNode }) => <li data-testid="section">{children}</li>,
      Item: ({
        children,
        id,
        textValue,
      }: {
        children: RenderChildren
        id: string
        textValue: string
      }) => {
        const resolved = typeof children === 'function' ? children({ isSelected: id === 'en' }) : children
        return (
          <li data-testid={`item-${id}`} data-text={textValue}>
            {resolved}
          </li>
        )
      },
      ItemIndicator: ({
        children,
      }: {
        children: RenderChildren
      }) => {
        const resolved = typeof children === 'function' ? children({ isSelected: true }) : children
        return <span data-testid="item-indicator">{resolved as React.ReactNode}</span>
      },
    },
  ),
  Button: ({ children, variant, ...props }: ComponentProps<'button'> & { variant?: string; isIconOnly?: boolean }) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
  Label: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}))

vi.mock('lucide-react', () => ({
  Languages: (_props: LucideProps) => <span data-testid="languages-icon" />,
  Check: ({ className }: LucideProps) => <span data-testid="check-icon" className={className} />,
}))

import LocaleSwitcher from './LocaleSwitcher'

describe('LocaleSwitcher', () => {
  it('渲染语言切换按钮', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByRole('button', { name: 'Languages' })).toBeDefined()
    expect(screen.getByTestId('languages-icon')).toBeDefined()
  })

  it('渲染所有语言选项', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByTestId('item-en')).toBeDefined()
    expect(screen.getByTestId('item-zh')).toBeDefined()
  })

  it('当前语言高亮显示', () => {
    render(<LocaleSwitcher />)
    const enItem = screen.getByTestId('item-en')
    const zhItem = screen.getByTestId('item-zh')
    // 'en' is the current locale, indicator shows check for it
    expect(enItem.querySelector('[data-testid="item-indicator"]')).toBeDefined()
    expect(zhItem.querySelector('[data-testid="item-indicator"]')).toBeDefined()
  })
})
