import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TablePagination from '@/components/common/TablePagination'

const mockSetParam = vi.fn()

const { mockGetParam } = vi.hoisted(() => ({
  mockGetParam: vi.fn<(key: string) => string | undefined>((key) => (key === 'page' ? '1' : undefined)),
}))

vi.mock('@/hooks/useSearchParamsQuery', () => ({
  default: vi.fn(() => ({
    getParam: mockGetParam,
    setParam: mockSetParam,
  })),
}))

function PaginationMock({ children }: { children?: React.ReactNode }) {
  return <nav>{children}</nav>
}
PaginationMock.Content = ({ children }: { children?: React.ReactNode }) => <>{children}</>
PaginationMock.Item = ({ children }: { children?: React.ReactNode }) => <>{children}</>
PaginationMock.Previous = ({ children, isDisabled, onClick }: {
  children?: React.ReactNode
  isDisabled?: boolean
  onClick?: () => void
}) => <button disabled={isDisabled} onClick={onClick}>{children}</button>
PaginationMock.PreviousIcon = () => <span>‹</span>
PaginationMock.Next = ({ children, isDisabled, onClick }: {
  children?: React.ReactNode
  isDisabled?: boolean
  onClick?: () => void
}) => <button disabled={isDisabled} onClick={onClick}>{children}</button>
PaginationMock.NextIcon = () => <span>›</span>
PaginationMock.Link = ({ children, isActive, onClick }: {
  children?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}) => <button data-active={isActive} onClick={onClick}>{children}</button>
PaginationMock.Ellipsis = () => <span>...</span>

vi.mock('@heroui/react', () => ({
  Pagination: PaginationMock,
}))

describe('TablePagination', () => {

  it('totalPages > 1 时渲染分页', () => {
    render(<TablePagination totalPages={5} />)
    expect(screen.getByRole('navigation')).toBeDefined()
  })

  it('渲染页码链接', () => {
    render(<TablePagination totalPages={3} />)
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('第一页时上一页按钮禁用', () => {
    render(<TablePagination totalPages={5} />)
    const prevBtn = screen.getByText('‹').closest('button')
    expect(prevBtn?.getAttribute('disabled')).not.toBeNull()
  })

  it('最后一页时下一页按钮禁用', () => {
    mockGetParam.mockReturnValue('5')
    render(<TablePagination totalPages={5} />)
    const nextBtn = screen.getByText('›').closest('button')
    expect(nextBtn?.getAttribute('disabled')).not.toBeNull()
    mockGetParam.mockReset()
  })

  it('totalPages 较大时显示省略号', () => {
    render(<TablePagination totalPages={10} />)
    expect(screen.getByText('...')).toBeDefined()
  })

  it('点击页码时调用 setParam', () => {
    render(<TablePagination totalPages={5} />)
    const page2 = screen.getByText('2')
    page2.click()
    expect(mockSetParam).toHaveBeenCalledWith('page', '2')
  })

  it('page 参数为空时按第一页处理', () => {
    mockGetParam.mockReturnValue(undefined)
    render(<TablePagination totalPages={5} />)
    expect(screen.getByText('1').closest('button')?.getAttribute('data-active')).toBe('true')
    expect(screen.getByText('‹').closest('button')?.hasAttribute('disabled')).toBe(true)
    mockGetParam.mockReset()
  })

  it('页数不是数字时不追加末页', () => {
    mockGetParam.mockReset()
    render(<TablePagination totalPages={Number.NaN} />)
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.queryByText('2')).toBeNull()
    expect(screen.queryByText('NaN')).toBeNull()
  })

  it('只有一页时只渲染第一页', () => {
    mockGetParam.mockReset()
    render(<TablePagination totalPages={1} />)
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.queryByText('2')).toBeNull()
    expect(screen.queryByText('...')).toBeNull()
  })

  it('点击上一页时写入上一页页码', () => {
    mockGetParam.mockReturnValue('3')
    mockSetParam.mockClear()
    render(<TablePagination totalPages={5} />)
    screen.getByText('‹').closest('button')?.click()
    expect(mockSetParam).toHaveBeenCalledWith('page', '2')
    mockGetParam.mockReset()
  })

  it('点击下一页时写入下一页页码', () => {
    mockGetParam.mockReturnValue('3')
    mockSetParam.mockClear()
    render(<TablePagination totalPages={5} />)
    screen.getByText('›').closest('button')?.click()
    expect(mockSetParam).toHaveBeenCalledWith('page', '4')
    mockGetParam.mockReset()
  })
})
