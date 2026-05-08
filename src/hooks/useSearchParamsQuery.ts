'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

/**
 * 参数配置类型
 * - string: 参数名
 * - [string, 'bool']: 布尔类型参数
 * - [string, ...string[]]: 枚举类型参数
 */
type ParamConfig =
  | string
  | [string, 'bool']
  | [string, ...string[]]

/**
 * 钩子返回类型
 */
interface UseSearchParamsQueryReturn {
  getParam: (key: string) => string | undefined
  getParams: (keys: string[]) => Record<string, string | undefined>
  setParam: (key: string, value: string | undefined) => void
  setParams: (updates: Record<string, string | undefined>) => void
  setParamDebounced: (key: string, value: string | undefined) => void
  setParamsDebounced: (updates: Record<string, string | undefined>) => void
  searchParams: URLSearchParams
}

/**
 * 搜索参数查询Hook
 * @param paramsConfig 参数配置数组（仅用于类型推导，运行时不需要）
 * @param debounceDelay 防抖延迟时间（毫秒），默认为300ms
 */
export default function useSearchParamsQuery<Config extends ParamConfig[]>(
  paramsConfig: Config,
  debounceDelay: number = 300,
): UseSearchParamsQueryReturn {
  void paramsConfig

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pendingUpdatesRef = useRef<Map<string, string | undefined>>(new Map())

  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.size === 0) return

    const params = new URLSearchParams(searchParams.toString())

    pendingUpdatesRef.current.forEach((value, key) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })

    pendingUpdatesRef.current.clear()

    router.replace(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const debouncedApplyUpdates = useDebouncedCallback(
    applyPendingUpdates,
    debounceDelay,
  )

  const setParam = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    } else {
      params.delete(key)
    }

    router.replace(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const setParamDebounced = useCallback((key: string, value: string | undefined) => {
    pendingUpdatesRef.current.set(key, value)
    debouncedApplyUpdates()
  }, [debouncedApplyUpdates])

  const setParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })

    router.replace(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const setParamsDebounced = useCallback((updates: Record<string, string | undefined>) => {
    Object.entries(updates).forEach(([key, value]) => {
      pendingUpdatesRef.current.set(key, value)
    })
    debouncedApplyUpdates()
  }, [debouncedApplyUpdates])

  const getParam = useCallback((key: string): string | undefined => {
    return searchParams.get(key) ?? undefined
  }, [searchParams])

  const getParams = useCallback((keys: string[]): Record<string, string | undefined> => {
    const result: Record<string, string | undefined> = {}

    keys.forEach((key) => {
      const value = searchParams.get(key)
      if (value !== null) {
        result[key] = value
      }
    })

    return result
  }, [searchParams])

  return {
    getParams,
    getParam,
    setParam,
    setParams,
    setParamDebounced,
    setParamsDebounced,
    searchParams,
  }
}
