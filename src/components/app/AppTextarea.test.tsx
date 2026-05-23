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
      TextArea: (props: ComponentProps<'textarea'>) => <textarea data-testid="textarea" placeholder={props.placeholder} {...props} />,
      Prefix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-prefix" {...rest}>{children}</span>,
      Suffix: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="input-suffix" {...rest}>{children}</span>,
    },
  ),
  Description: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="description" {...rest}>{children}</span>,
  FieldError: (props: ComponentProps<'div'>) => <span data-testid="field-error" {...props} />,
}))

import AppTextarea from './AppTextarea'

describe('AppTextarea', () => {
  it('渲染 label', () => {
    render(<AppTextarea label="简介" />)
    expect(screen.getByText('简介')).toBeDefined()
  })

  it('渲染 textarea 并透传 placeholder', () => {
    render(<AppTextarea label="简介" placeholder="请输入简介" />)
    const textarea = screen.getByTestId('textarea')
    expect(textarea.getAttribute('placeholder')).toBe('请输入简介')
  })

  it('渲染 description', () => {
    render(<AppTextarea label="简介" description="最多 500 字" />)
    expect(screen.getByTestId('description')).toBeDefined()
  })
})
