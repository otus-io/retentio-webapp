'use client'
import { ToastProvider } from '@heroui/react'
import { ThemeProvider } from '@/provider/ThemeProvider'

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider
      attribute={['class', 'data-theme']}
      defaultTheme="dark"
    >
      <ToastProvider placement="top" />
      {children}
    </ThemeProvider>
  )
}
