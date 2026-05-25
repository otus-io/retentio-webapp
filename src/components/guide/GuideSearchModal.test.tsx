import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GuideSearchModal from './GuideSearchModal'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Search: ({ className }: { className?: string }) => <span data-testid="search-icon" className={className} />,
  FileText: ({ className }: { className?: string }) => <span data-testid="file-text-icon" className={className} />,
  Hash: ({ className }: { className?: string }) => <span data-testid="hash-icon" className={className} />,
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'placeholder': '搜索文档...',
      'escHint': 'ESC',
      'noResults': '没有找到结果',
    }
    return map[key] || key
  },
  useLocale: () => 'zh',
}))

// Mock next/navigation
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// Mock @heroui/react
vi.mock('@heroui/react', () => ({
  Modal: {
    Backdrop: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean; onOpenChange: (v: boolean) => void }) =>
      isOpen ? <div data-testid="modal-backdrop">{children}</div> : null,
    Container: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-container">{children}</div>,
    Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-dialog">{children}</div>,
  },
}))

const mockEntries = [
  {
    slug: 'key-concepts/overview',
    title: '快速开始',
    description: '了解如何快速上手使用平台',
    headings: [
      { text: '安装配置', id: 'installation' },
      { text: '创建项目', id: 'create-project' },
    ],
  },
  {
    slug: 'api-reference',
    title: 'API 参考',
    description: '完整的 API 接口文档',
    headings: [
      { text: '认证接口', id: 'auth' },
      { text: '数据接口', id: 'data' },
    ],
  },
]

describe('GuideSearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockEntries),
    })
  })

  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
  }

  describe('渲染', () => {
    it('isOpen 为 true 时渲染搜索框', () => {
      render(<GuideSearchModal {...defaultProps} />)
      expect(screen.getByRole('textbox')).toBeDefined()
      expect(screen.getByPlaceholderText('搜索文档...')).toBeDefined()
    })

    it('isOpen 为 false 时不渲染', () => {
      render(<GuideSearchModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('textbox')).toBeNull()
    })

    it('渲染搜索结果列表', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
        expect(screen.getByText('API 参考')).toBeDefined()
      })
    })

    it('显示 ESC 提示', () => {
      render(<GuideSearchModal {...defaultProps} />)
      expect(screen.getByText('ESC')).toBeDefined()
    })
  })

  describe('数据加载', () => {
    it('根据 locale 加载正确的搜索索引', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/search-index/zh.json')
      })
    })

    it('fetch 失败时不崩溃', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('没有找到结果')).toBeDefined()
      })
    })
  })

  describe('搜索过滤', () => {
    it('输入查询时过滤结果', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'API' } })

      await waitFor(() => {
        expect(screen.getByText('API 参考')).toBeDefined()
        expect(screen.queryByText('快速开始')).toBeNull()
      })
    })

    it('匹配标题中的文字', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '快速' } })

      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
        expect(screen.queryByText('API 参考')).toBeNull()
      })
    })

    it('匹配描述中的文字', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '接口文档' } })

      await waitFor(() => {
        expect(screen.getByText('API 参考')).toBeDefined()
        expect(screen.queryByText('快速开始')).toBeNull()
      })
    })

    it('匹配标题时渲染对应标题项', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '安装' } })

      await waitFor(() => {
        expect(screen.getByText('安装配置')).toBeDefined()
      })
    })

    it('无匹配时显示空状态', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '不存在的搜索词' } })

      await waitFor(() => {
        expect(screen.getByText('没有找到结果')).toBeDefined()
      })
    })

    it('修改查询时重置活动索引', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'API' } })

      // 第一个按钮（API 参考）应该是高亮状态
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const firstResult = buttons.find((b) => b.textContent?.includes('API 参考'))
        expect(firstResult?.className).toContain('bg-default/50')
      })
    })
  })

  describe('键盘导航', () => {
    it('ArrowDown 移动到下一个结果', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' })

      // 第二个按钮应该高亮
      const buttons = screen.getAllByRole('button')
      expect(buttons[1].className).toContain('bg-default/50')
    })

    it('ArrowUp 移动到上一个结果', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' })

      // 应该循环到最后一个结果
      const buttons = screen.getAllByRole('button')
      expect(buttons[buttons.length - 1].className).toContain('bg-default/50')
    })

    it('Enter 导航到选中的结果', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/guide/key-concepts/overview')
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('Enter 导航到带 hash 的标题结果', async () => {
      const entriesWithHeadings = [
        { slug: 'guide', title: 'Guide', description: 'desc', headings: [{ text: 'Section', id: 'section-1' }] },
      ]
      global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(entriesWithHeadings) })

      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Guide')).toBeDefined()
      })

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Section' } })

      await waitFor(() => {
        expect(screen.getByText('Section')).toBeDefined()
      })

      // 第一个结果是页面条目(Guide)，ArrowDown 移动到标题条目(Section)
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' })
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/guide/guide#section-1')
      })
    })
  })

  describe('鼠标交互', () => {
    it('点击结果导航到对应页面', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      fireEvent.click(screen.getByText('快速开始'))

      expect(pushMock).toHaveBeenCalledWith('/guide/key-concepts/overview')
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('鼠标悬停时设置活动索引', async () => {
      render(<GuideSearchModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('快速开始')).toBeDefined()
      })

      const buttons = screen.getAllByRole('button')
      fireEvent.mouseEnter(buttons[1])

      expect(buttons[1].className).toContain('bg-default/50')
    })
  })

  describe('状态重置', () => {
    it('打开时重置查询和活动索引', async () => {
      const { rerender } = render(<GuideSearchModal isOpen={false} onOpenChange={vi.fn()} />)
      expect(screen.queryByRole('textbox')).toBeNull()

      rerender(<GuideSearchModal {...defaultProps} />)

      await waitFor(() => {
        const input = screen.getByRole('textbox') as HTMLInputElement
        expect(input.value).toBe('')
      })
    })
  })
})
