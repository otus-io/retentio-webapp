import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'

vi.mock('@heroui/react', () => ({
  TextField: ({ children, ...rest }: ComponentProps<'div'>) => <div data-testid="text-field" {...rest}>{children}</div>,
  Label: ({ children, ...rest }: ComponentProps<'label'>) => <label data-testid="label" {...rest}>{children}</label>,
  InputGroup: Object.assign(
    ({ children, variant, ...rest }: ComponentProps<'div'> & { variant?: string }) => (
      <div data-testid="input-group" {...rest}>{children}</div>
    ),
    {
      Input: (props: ComponentProps<'input'>) => <input data-testid="input" type={props.type} placeholder={props.placeholder} {...props} />,
      Prefix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-prefix" {...rest}>{children}</span>,
      Suffix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-suffix" {...rest}>{children}</span>,
    },
  ),
  Description: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="description" {...rest}>{children}</span>,
  FieldError: (props: ComponentProps<'div'>) => <span data-testid="field-error" {...props} />,
}))

vi.mock('lucide-react', () => ({
  Eye: (props: ComponentProps<'span'>) => <span data-testid="eye-icon" {...props} />,
  EyeOff: (props: ComponentProps<'span'>) => <span data-testid="eye-off-icon" {...props} />,
}))

import AppPasswordInput from './AppPasswordInput'

describe('AppPasswordInput', () => {
  it('默认类型为 password', () => {
    render(<AppPasswordInput label="密码" />)
    const input = screen.getByTestId('input')
    expect(input.getAttribute('type')).toBe('password')
  })

  it('点击切换按钮变为 text', () => {
    render(<AppPasswordInput label="密码" />)
    fireEvent.click(screen.getByRole('button'))
    const input = screen.getByTestId('input')
    expect(input.getAttribute('type')).toBe('text')
  })

  it('再次点击切回 password', () => {
    render(<AppPasswordInput label="密码" />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.getByTestId('input').getAttribute('type')).toBe('password')
  })

  it('渲染 label', () => {
    render(<AppPasswordInput label="密码" />)
    expect(screen.getByText('密码')).toBeDefined()
  })
})
