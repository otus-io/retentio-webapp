'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback } from 'react'
import ClientOnly from '@/components/app/ClientOnly'
import { Button } from '@heroui/react'

function ThemeButtonInner() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = useCallback(() => {
    setTheme((theme) => {
      return theme === 'light' ? 'dark' : 'light'
    })
  }, [setTheme])

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      isIconOnly
    >
      {
        resolvedTheme === 'light'
          ? <Sun size={16} />
          : <Moon size={16} />
      }
    </Button>
  )
}

export default function ThemeButton() {
  return (
    <ClientOnly>
      <ThemeButtonInner />
    </ClientOnly>
  )
}
