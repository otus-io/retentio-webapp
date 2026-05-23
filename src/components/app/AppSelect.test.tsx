import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

vi.mock('@heroui/react', () => ({
  Select: Object.assign(
    ({ children, value, className, placeholder, onChange, ...rest }: ComponentProps<'div'> & { value?: string; placeholder?: string; onChange?: (value: string | null) => void }) => (
      <div data-testid="select" data-value={value} className={className} {...rest}>
        {children}
      </div>
    ),
    {
      Trigger: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="select-trigger" {...rest}>{children}</span>,
      Value: (props: ComponentProps<'span'>) => <span data-testid="select-value" {...props} />,
      Indicator: (props: ComponentProps<'span'>) => <span data-testid="select-indicator" {...props} />,
      Popover: ({ children, ...rest }: ComponentProps<'div'>) => <div data-testid="select-popover" {...rest}>{children}</div>,
    },
  ),
  Label: ({ children, ...rest }: ComponentProps<'label'>) => <label data-testid="select-label" {...rest}>{children}</label>,
  ListBox: Object.assign(
    ({ children, ...rest }: ComponentProps<'ul'>) => <ul data-testid="list-box" {...rest}>{children}</ul>,
    {
      Item: ({ children, id, textValue, ...rest }: ComponentProps<'li'> & { id?: string; textValue?: string }) => (
        <li data-testid="list-item" data-id={id} data-text={textValue} {...rest}>{children}</li>
      ),
      ItemIndicator: (props: ComponentProps<'span'>) => <span data-testid="item-indicator" {...props} />,
    },
  ),
}))

import AppSelect from './AppSelect'

describe('AppSelect', () => {
  const items = [
    { id: '1', name: '选项一' },
    { id: '2', name: '选项二' },
  ]

  it('渲染 label', () => {
    render(<AppSelect items={items} label="选择器" />)
    expect(screen.getByText('选择器')).toBeDefined()
  })

  it('渲染所有列表项', () => {
    render(<AppSelect items={items} label="选择器" />)
    expect(screen.getByText('选项一')).toBeDefined()
    expect(screen.getByText('选项二')).toBeDefined()
  })

  it('默认使用 w-[256px] className', () => {
    render(<AppSelect items={items} label="选择器" />)
    expect(screen.getByTestId('select').className).toContain('w-[256px]')
  })

  it('受控模式下使用外部 value', () => {
    render(<AppSelect items={items} label="选择器" value="2" />)
    expect(screen.getByTestId('select').getAttribute('data-value')).toBe('2')
  })
})
