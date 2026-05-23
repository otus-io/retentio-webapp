import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AppAvatarProps } from './AppAvatar'
import type { AvatarImageProps, AvatarFallbackProps } from '@heroui/react'
import AppAvatar from './AppAvatar'

vi.mock('@heroui/react', () => ({
  Avatar: Object.assign(
    ({ children, size, color, variant, className }: AppAvatarProps) => (
      <div data-testid="avatar" data-size={size} data-color={color} data-variant={variant} className={className}>
        {children}
      </div>
    ),
    {
      // eslint-disable-next-line @next/next/no-img-element,jsx-a11y/alt-text
      Image: (props: AvatarImageProps) => <img data-testid="avatar-image" {...props} />,
      Fallback: ({ children, delayMs }: AvatarFallbackProps) => (
        <span data-testid="avatar-fallback" data-delay={delayMs}>{children}</span>
      ),
    },
  ),
}))

describe('AppAvatar', () => {
  it('渲染图片', () => {
    render(<AppAvatar src="/avatar.png" />)
    const img = screen.getByTestId('avatar-image')
    expect(img.getAttribute('src')).toBe('/avatar.png')
  })

  it('渲染 fallback', () => {
    render(<AppAvatar src="/a.png">张三</AppAvatar>)
    expect(screen.getByTestId('avatar-fallback')).toBeDefined()
    expect(screen.getByText('张三')).toBeDefined()
  })

  it('无 children 时不渲染 fallback', () => {
    render(<AppAvatar src="/a.png" />)
    expect(screen.queryByTestId('avatar-fallback')).toBeNull()
  })

  it('透传 size 和 variant', () => {
    render(<AppAvatar src="/a.png" size="lg" variant="soft" />)
    const avatar = screen.getByTestId('avatar')
    expect(avatar.getAttribute('data-size')).toBe('lg')
    expect(avatar.getAttribute('data-variant')).toBe('soft')
  })
})
