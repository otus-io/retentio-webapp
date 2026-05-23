import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { LucideProps } from 'lucide-react'
import type { UseThemeProps } from 'next-themes'

const mockSetTheme = vi.fn()

function setTheme(value: React.SetStateAction<string>) {
  mockSetTheme(value)
}

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: 'light',
    setTheme,
  })),
}))

vi.mock('@/components/app/ClientOnly', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@heroui/react', () => ({
  Button: ({ children, onClick, variant, ...props }: ComponentProps<'button'> & { variant?: string; isIconOnly?: boolean }) => (
    <button onClick={onClick} data-variant={variant} {...props}>{children}</button>
  ),
}))

vi.mock('lucide-react', () => ({
  Sun: (_props: LucideProps) => <span data-testid="sun-icon">sun</span>,
  Moon: (_props: LucideProps) => <span data-testid="moon-icon">moon</span>,
}))

import { useTheme } from 'next-themes'
import ThemeButton from './ThemeButton'



const lightTheme: UseThemeProps = {
  themes: ['light', 'dark'],
  setTheme,
  resolvedTheme: 'light',
}

const darkTheme: UseThemeProps = {
  themes: ['light', 'dark'],
  setTheme,
  resolvedTheme: 'dark',
}

describe('ThemeButton', () => {
  it('亮色主题时渲染 Sun 图标', () => {
    vi.mocked(useTheme).mockReturnValue(lightTheme)
    render(<ThemeButton />)
    expect(screen.getByTestId('sun-icon')).toBeDefined()
  })

  it('点击按钮切换主题', () => {
    vi.mocked(useTheme).mockReturnValue(lightTheme)
    render(<ThemeButton />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalled()
    const updater = mockSetTheme.mock.calls[0][0]
    expect(updater('light')).toBe('dark')
    expect(updater('dark')).toBe('light')
  })

  it('暗色主题时渲染 Moon 图标', () => {
    vi.mocked(useTheme).mockReturnValue(darkTheme)
    render(<ThemeButton />)
    expect(screen.getByTestId('moon-icon')).toBeDefined()
  })
})
