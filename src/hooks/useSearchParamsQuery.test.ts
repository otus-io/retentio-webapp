// cspell:words zhangsan

import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useSearchParamsQuery from './useSearchParamsQuery'

const { replaceMock, usePathname, useRouter, useSearchParams } = vi.hoisted(() => {
  const replaceMock = vi.fn()
  return {
    replaceMock,
    usePathname: vi.fn(() => '/test'),
    useRouter: vi.fn(() => ({ replace: replaceMock })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  }
})

vi.mock('next/navigation', () => ({
  usePathname,
  useRouter,
  useSearchParams,
}))

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: () => void) => fn,
}))

describe('useSearchParamsQuery', () => {
  it('getParam 读取参数', () => {
    useSearchParams.mockReturnValue(new URLSearchParams('?name=zhangsan&age=18'))
    const { result } = renderHook(() => useSearchParamsQuery([]))
    expect(result.current.getParam('name')).toBe('zhangsan')
    expect(result.current.getParam('age')).toBe('18')
    expect(result.current.getParam('missing')).toBeUndefined()
  })

  it('getParams 批量读取', () => {
    useSearchParams.mockReturnValue(new URLSearchParams('?a=1&b=2&c=3'))
    const { result } = renderHook(() => useSearchParamsQuery([]))
    expect(result.current.getParams(['a', 'b', 'missing'])).toEqual({ a: '1', b: '2' })
  })

  it('setParam 设置参数并调用 router.replace', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    const { result } = renderHook(() => useSearchParamsQuery([]))

    result.current.setParam('page', '2')
    expect(replaceMock).toHaveBeenCalledWith('/test?page=2')
  })

  it('setParam 值为空时删除参数', () => {
    useSearchParams.mockReturnValue(new URLSearchParams('?page=1'))
    const { result } = renderHook(() => useSearchParamsQuery([]))

    result.current.setParam('page', '')
    expect(replaceMock).toHaveBeenCalledWith('/test?')
  })

  it('setParams 批量设置多个参数', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    const { result } = renderHook(() => useSearchParamsQuery([]))

    result.current.setParams({ page: '1', size: '20' })
    expect(replaceMock).toHaveBeenCalledWith('/test?page=1&size=20')
  })

  it('setParamDebounced 防抖设置参数', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    const { result } = renderHook(() => useSearchParamsQuery([], 500))

    result.current.setParamDebounced('q', 'test')
    expect(replaceMock).toHaveBeenCalledWith('/test?q=test')
  })

  it('setParamsDebounced 函数存在', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    const { result } = renderHook(() => useSearchParamsQuery([]))

    expect(typeof result.current.setParamsDebounced).toBe('function')
  })

  it('searchParams 透传原始值', () => {
    const params = new URLSearchParams('?foo=bar')
    useSearchParams.mockReturnValue(params)
    const { result } = renderHook(() => useSearchParamsQuery([]))

    expect(result.current.searchParams).toBe(params)
  })
})
