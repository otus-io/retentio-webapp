import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('@heroui/react', async () => {
  const React = await vi.importActual('react')
  return { useSafeLayoutEffect: React.useLayoutEffect }
})

import { BreakpointProvider, useBreakpointContext } from './BreakpointContext'

function Consumer() {
  const ctx = useBreakpointContext()
  return (
    <div>
      <span data-testid="isMounted">{String(ctx.isMounted)}</span>
      <span data-testid="current">{ctx.current}</span>
      <span data-testid="sm">{String(ctx.sm)}</span>
      <span data-testid="md">{String(ctx.md)}</span>
      <span data-testid="lg">{String(ctx.lg)}</span>
      <span data-testid="xl">{String(ctx.xl)}</span>
      <span data-testid="2xl">{String(ctx['2xl'])}</span>
    </div>
  )
}

function renderProvider() {
  return render(
    <BreakpointProvider>
      <Consumer />
    </BreakpointProvider>,
  )
}

type MatchMediaMock = ReturnType<typeof vi.fn> & {
  _mqls: Map<string, MediaQueryList>
  _listeners: Map<string, Array<(e: MediaQueryListEvent) => void>>
}

function createMatchMedia(matchesMap: Record<string, boolean>) {
  const listeners = new Map<string, Array<(e: MediaQueryListEvent) => void>>()

  const matchMedia = vi.fn((query: string) => {
    const mql = {
      matches: matchesMap[query] ?? false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(
        (_type: string, handler: (e: MediaQueryListEvent) => void) => {
          if (!listeners.has(query)) listeners.set(query, [])
          listeners.get(query)!.push(handler)
        },
      ),
      removeEventListener: vi.fn(
        (_type: string, handler: (e: MediaQueryListEvent) => void) => {
          const arr = listeners.get(query)
          if (arr) {
            const idx = arr.indexOf(handler)
            if (idx !== -1) arr.splice(idx, 1)
          }
        },
      ),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList

    ;(matchMedia as MatchMediaMock)._mqls.set(query, mql)
    return mql
  }) as MatchMediaMock

  matchMedia._mqls = new Map<string, MediaQueryList>()
  matchMedia._listeners = listeners

  return matchMedia
}

describe('BreakpointContext', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  describe('初始状态', () => {
    it('默认状态下所有断点为 false，current 为 xs', () => {
      vi.stubGlobal('matchMedia', createMatchMedia({}))
      renderProvider()
      expect(screen.getByTestId('sm').textContent).toBe('false')
      expect(screen.getByTestId('md').textContent).toBe('false')
      expect(screen.getByTestId('lg').textContent).toBe('false')
      expect(screen.getByTestId('xl').textContent).toBe('false')
      expect(screen.getByTestId('2xl').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('xs')
    })
  })

  describe('断点匹配', () => {
    it('视口 < 640px 时只匹配 xs', () => {
      vi.stubGlobal('matchMedia', createMatchMedia({}))
      renderProvider()
      expect(screen.getByTestId('sm').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('xs')
      expect(screen.getByTestId('isMounted').textContent).toBe('true')
    })

    it('视口 >= 640px 时匹配 sm', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({ '(min-width: 640px)': true }),
      )
      renderProvider()
      expect(screen.getByTestId('sm').textContent).toBe('true')
      expect(screen.getByTestId('md').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('sm')
    })

    it('视口 >= 768px 时匹配 md', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({
          '(min-width: 640px)': true,
          '(min-width: 768px)': true,
        }),
      )
      renderProvider()
      expect(screen.getByTestId('md').textContent).toBe('true')
      expect(screen.getByTestId('lg').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('md')
    })

    it('视口 >= 1024px 时匹配 lg', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({
          '(min-width: 640px)': true,
          '(min-width: 768px)': true,
          '(min-width: 1024px)': true,
        }),
      )
      renderProvider()
      expect(screen.getByTestId('lg').textContent).toBe('true')
      expect(screen.getByTestId('xl').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('lg')
    })

    it('视口 >= 1280px 时匹配 xl', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({
          '(min-width: 640px)': true,
          '(min-width: 768px)': true,
          '(min-width: 1024px)': true,
          '(min-width: 1280px)': true,
        }),
      )
      renderProvider()
      expect(screen.getByTestId('xl').textContent).toBe('true')
      expect(screen.getByTestId('2xl').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('xl')
    })

    it('视口 >= 1536px 时匹配 2xl', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({
          '(min-width: 640px)': true,
          '(min-width: 768px)': true,
          '(min-width: 1024px)': true,
          '(min-width: 1280px)': true,
          '(min-width: 1536px)': true,
        }),
      )
      renderProvider()
      expect(screen.getByTestId('2xl').textContent).toBe('true')
      expect(screen.getByTestId('current').textContent).toBe('2xl')
    })
  })

  describe('current 计算逻辑', () => {
    it('多个断点同时匹配时 current 取最大值', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMedia({
          '(min-width: 640px)': true,
          '(min-width: 768px)': true,
          '(min-width: 1024px)': false,
        }),
      )
      renderProvider()
      expect(screen.getByTestId('sm').textContent).toBe('true')
      expect(screen.getByTestId('md').textContent).toBe('true')
      expect(screen.getByTestId('lg').textContent).toBe('false')
      expect(screen.getByTestId('current').textContent).toBe('md')
    })
  })

  describe('响应式更新', () => {
    it('matchMedia change 事件触发状态更新', () => {
      const mm = createMatchMedia({ '(min-width: 640px)': false })
      vi.stubGlobal('matchMedia', mm)
      renderProvider()

      expect(screen.getByTestId('sm').textContent).toBe('false')

      // 模拟视口变化到 sm
      const smMql = mm._mqls.get('(min-width: 640px)')!
      Object.defineProperty(smMql, 'matches', { value: true })
      act(() => {
        mm._listeners.get('(min-width: 640px)')!.forEach((h) =>
          h({ matches: true } as MediaQueryListEvent))
      })

      expect(screen.getByTestId('sm').textContent).toBe('true')
      expect(screen.getByTestId('current').textContent).toBe('sm')
    })
  })

  describe('卸载清理', () => {
    it('组件卸载时移除所有 listener', () => {
      const mm = createMatchMedia({})
      vi.stubGlobal('matchMedia', mm)
      const { unmount } = renderProvider()

      unmount()

      for (const mql of mm._mqls.values()) {
        expect(mql.removeEventListener).toHaveBeenCalled()
      }
    })
  })

  describe('useBreakpointContext 独立使用', () => {
    it('在 Provider 外部使用时返回默认状态（所有断点 false，无 current）', () => {
      function Standalone() {
        const ctx = useBreakpointContext()
        return (
          <div>
            <span data-testid="sm">{String(ctx.sm)}</span>
            <span data-testid="isMounted">{String(ctx.isMounted)}</span>
          </div>
        )
      }
      render(<Standalone />)
      expect(screen.getByTestId('sm').textContent).toBe('false')
      expect(screen.getByTestId('isMounted').textContent).toBe('false')
    })
  })
})
