'use client'
import { ToastProvider } from '@heroui/react'
import { ThemeProvider } from '@/provider/ThemeProvider'
import { BreakpointProvider } from '@/context/BreakpointContext'

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider
      attribute={['class', 'data-theme']}
      defaultTheme="dark"
    >
      <BreakpointProvider>
        <ToastProvider placement="top" />
        {children}
      </BreakpointProvider>
    </ThemeProvider>
  )
}
