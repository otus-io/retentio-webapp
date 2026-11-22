import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RubyText from '@/components/app/RubyText'

describe('RubyText', () => {
  it('shows each reading above its base', () => {
    const { container } = render(<p><RubyText text="[[漢字|かんじ]]を書く" /></p>)
    expect(container.querySelector('p')!.innerHTML).toBe('<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>を書く')
  })

  it('renders plain text unchanged', () => {
    const { container } = render(<p><RubyText text="hello [world]" /></p>)
    expect(container.querySelector('p')!.innerHTML).toBe('hello [world]')
  })
})
