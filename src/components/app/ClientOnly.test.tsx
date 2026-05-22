import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClientOnly from './ClientOnly'

describe('ClientOnly', () => {
  it('挂载后渲染子内容', () => {
    render(<ClientOnly><span>客户端内容</span></ClientOnly>)
    expect(screen.getByText('客户端内容')).toBeDefined()
  })
})
