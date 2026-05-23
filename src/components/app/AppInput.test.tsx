import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

vi.mock('@heroui/react', () => ({
  TextField: ({ children, ...rest }: ComponentProps<'div'>) => <div data-testid="text-field" {...rest}>{children}</div>,
  Label: ({ children, ...rest }: ComponentProps<'label'>) => <label data-testid="label" {...rest}>{children}</label>,
  InputGroup: Object.assign(
    ({ children, variant, ...rest }: ComponentProps<'div'> & { variant?: string }) => (
      <div data-testid="input-group" data-variant={variant} {...rest}>{children}</div>
    ),
    {
      Input: (props: ComponentProps<'input'>) => <input data-testid="input" placeholder={props.placeholder} {...props} />,
      Prefix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-prefix" {...rest}>{children}</span>,
      Suffix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-suffix" {...rest}>{children}</span>,
    },
  ),
  Description: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="description" {...rest}>{children}</span>,
  FieldError: (props: ComponentProps<'div'>) => <span data-testid="field-error" {...props} />,
}))

import AppInput from './AppInput'

describe('AppInput', () => {
  it('渲染 label', () => {
    render(<AppInput label="用户名" />)
    expect(screen.getByText('用户名')).toBeDefined()
  })

  it('渲染 input 并透传 placeholder', () => {
    render(<AppInput label="用户名" placeholder="请输入" />)
    const input = screen.getByTestId('input')
    expect(input.getAttribute('placeholder')).toBe('请输入')
  })

  it('渲染 prefix', () => {
    render(<AppInput label="金额" prefix={<span>¥</span>} />)
    expect(screen.getByTestId('input-prefix')).toBeDefined()
    expect(screen.getByText('¥')).toBeDefined()
  })

  it('渲染 suffix', () => {
    render(<AppInput label="域名" suffix={<span>.com</span>} />)
    expect(screen.getByTestId('input-suffix')).toBeDefined()
    expect(screen.getByText('.com')).toBeDefined()
  })

  it('渲染 description', () => {
    render(<AppInput label="密码" description="至少 8 位" />)
    expect(screen.getByTestId('description')).toBeDefined()
  })

  it('不传 label 时不渲染 Label', () => {
    render(<AppInput />)
    expect(screen.queryByTestId('label')).toBeNull()
  })
})
