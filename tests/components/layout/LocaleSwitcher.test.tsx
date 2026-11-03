import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { createContext, useContext, type ComponentProps } from 'react'
import type { LucideProps } from 'lucide-react'

const SelectedContext = createContext(false)

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
      Menu: ({
        children,
        selectionMode,
        onSelectionChange,
      }: {
        children?: React.ReactNode
        selectionMode?: string
        onSelectionChange?: (keys: Set<string> | null) => void
      }) => (
        <ul data-testid="menu" data-selection-mode={selectionMode}>
          <button type="button" data-testid="select-zh" onClick={() => onSelectionChange?.(new Set(['zh']))}>
            zh
          </button>
          <button type="button" data-testid="select-none" onClick={() => onSelectionChange?.(null)}>
            none
          </button>
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
        const isSelected = id === 'en'
        const resolved = typeof children === 'function' ? children({ isSelected }) : children
        return (
          <SelectedContext.Provider value={isSelected}>
            <li data-testid={`item-${id}`} data-text={textValue}>
              {resolved}
            </li>
          </SelectedContext.Provider>
        )
      },
      ItemIndicator: ({
        children,
      }: {
        children: RenderChildren
      }) => {
        const isSelected = useContext(SelectedContext)
        const resolved = typeof children === 'function' ? children({ isSelected }) : children
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

import LocaleSwitcher from '@/components/layout/LocaleSwitcher'

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
    expect(enItem.querySelector('[data-testid="check-icon"]')).toBeTruthy()
    expect(zhItem.querySelector('[data-testid="check-icon"]')).toBeNull()
    expect(screen.getByTestId('item-ja').querySelector('[data-testid="check-icon"]')).toBeNull()
  })

  it('选择语言时调用 setLocaleAction', async () => {
    mockSetLocaleAction.mockResolvedValue(undefined)
    render(<LocaleSwitcher />)
    await act(async () => {
      screen.getByTestId('select-zh').click()
    })
    expect(mockSetLocaleAction).toHaveBeenCalledWith('zh')
  })

  it('空选择不切换语言', async () => {
    mockSetLocaleAction.mockClear()
    render(<LocaleSwitcher />)
    await act(async () => {
      screen.getByTestId('select-none').click()
    })
    expect(mockSetLocaleAction).not.toHaveBeenCalled()
  })
})
