import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

vi.mock('@heroui/react', () => ({
  Tooltip: Object.assign(
    ({ children, delay, ...rest }: ComponentProps<'div'> & { delay?: number }) => (
      <div data-testid="tooltip" data-delay={delay} {...rest}>{children}</div>
    ),
    {
      Trigger: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="tooltip-trigger" {...rest}>{children}</span>,
      Content: ({ children, ...rest }: ComponentProps<'div'>) => <span data-testid="tooltip-content" {...rest}>{children}</span>,
    },
  ),
}))

import AppTooltip from './AppTooltip'

describe('AppTooltip', () => {
  it('默认 trigger=true 渲染 Trigger 包裹', () => {
    render(<AppTooltip content="提示内容"><button>按钮</button></AppTooltip>)
    expect(screen.getByTestId('tooltip-trigger')).toBeDefined()
    expect(screen.getByTestId('tooltip-content')).toBeDefined()
  })

  it('trigger=false 时不渲染 Trigger', () => {
    render(<AppTooltip content="提示" trigger={false}><button>按钮</button></AppTooltip>)
    expect(screen.queryByTestId('tooltip-trigger')).toBeNull()
  })

  it('渲染 content 内容', () => {
    render(<AppTooltip content="自定义提示"><button>按钮</button></AppTooltip>)
    expect(screen.getByText('自定义提示')).toBeDefined()
  })
})
