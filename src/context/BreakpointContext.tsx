// context/BreakpointContext.tsx
'use client'

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { BREAKPOINTS, type Breakpoint } from '@/lib/breakpoints'
import { useSafeLayoutEffect } from '@heroui/react'

type BreakpointState = Record<Breakpoint, boolean> & { isMounted: boolean }

const defaultState: BreakpointState = {
  sm: false,
  md: false,
  lg: false,
  xl: false,
  '2xl': false,
  isMounted: false,
}

const BreakpointContext = createContext<BreakpointState>(defaultState)

export function BreakpointProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BreakpointState>(defaultState)

  useSafeLayoutEffect(() => {
    const mqls = (Object.entries(BREAKPOINTS) as [Breakpoint, string][]).map(
      ([key, query]) => {
        const mql = window.matchMedia(query)
        const handler = (e: MediaQueryListEvent) =>
          setState((prev) => ({ ...prev, [key]: e.matches }))
        mql.addEventListener('change', handler)
        return { key, mql, handler }
      },
    )

    setState(
      mqls.reduce(
        (acc, { key, mql }) => ({ ...acc, [key]: mql.matches }),
        { isMounted: true } as BreakpointState,
      ),
    )

    return () => {
      mqls.forEach(({ mql, handler }) => mql.removeEventListener('change', handler))
    }
  }, [])

  const value = useMemo(() => {
    const current: Breakpoint | 'xs' = state['2xl']
      ? '2xl'
      : state.xl
        ? 'xl'
        : state.lg
          ? 'lg'
          : state.md
            ? 'md'
            : state.sm
              ? 'sm'
              : 'xs'
    return { ...state, current }
  }, [state])


  return (
    <BreakpointContext.Provider value={value}>
      {children}
    </BreakpointContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBreakpointContext() {
  return useContext(BreakpointContext)
}
