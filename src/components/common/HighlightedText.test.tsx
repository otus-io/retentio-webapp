import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HighlightedText from './HighlightedText'

describe('HighlightedText', () => {
  it('无高亮关键词时渲染纯文本', () => {
    render(<HighlightedText text="这是一段测试文本" highlight="" />)
    expect(screen.getByText('这是一段测试文本')).toBeDefined()
  })

  it('高亮关键词为空白字符串时不添加 mark 标签', () => {
    render(<HighlightedText text="测试" highlight="  " />)
    expect(screen.queryByRole('mark')).toBeNull()
  })

  it('高亮匹配的字符', () => {
    render(<HighlightedText text="配置管理" highlight="配置" />)
    const marks = screen.getAllByRole('mark')
    expect(marks.length).toBeGreaterThan(0)
  })

  it('不分词匹配——逐字符高亮', () => {
    render(<HighlightedText text="AB 测试" highlight="A测" />)
    const marks = screen.getAllByRole('mark')
    // 每个匹配的字符被拆分为独立的 mark
    expect(marks.length).toBe(2)
  })

  it('无匹配字符时不添加 mark', () => {
    render(<HighlightedText text="hello" highlight="xyz" />)
    expect(screen.queryByRole('mark')).toBeNull()
  })

  it('高亮文本带 accent 背景色', () => {
    render(<HighlightedText text="测试" highlight="测" />)
    const mark = screen.getByRole('mark')
    expect(mark.className).toContain('bg-accent')
  })
})
