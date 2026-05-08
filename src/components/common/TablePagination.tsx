'use client'

import { useMemo } from 'react'
import { Pagination } from '@heroui/react'
import useSearchParamsQuery from '@/hooks/useSearchParamsQuery'

export interface TablePaginationProps {
  totalPages: number
}

export default function TablePagination({ totalPages }: TablePaginationProps) {
  const { getParam, setParam } = useSearchParamsQuery(['page'])
  const page = Number(getParam('page') || '1')

  const pageNumbers = useMemo((): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 1) return []

    pages.push(1)
    if (totalPages > 1 && page > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis')
    }
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center w-full">
      <Pagination className="justify-center">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={page === 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          {pageNumbers.map((p, i) =>
            p === 'ellipsis'
              ? (
                <Pagination.Item key={`ellipsis-${i}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              )
              : (
                <Pagination.Item key={p}>
                  <Pagination.Link
                    isActive={p === page}
                    onClick={() => setParam('page', String(p))}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
          <Pagination.Item>
            <Pagination.Next
              isDisabled={page === totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  )
}
