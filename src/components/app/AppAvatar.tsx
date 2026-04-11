import type { AvatarFallbackProps, AvatarImageProps, AvatarProps } from '@heroui/react'
import { Avatar } from '@heroui/react'

export type AppAvatarProps = AvatarProps & AvatarImageProps & AvatarFallbackProps

export default function AppAvatar({
  size,
  color,
  variant,
  className,
  delayMs,
  src,
  children,
  ...imgProps

}: AppAvatarProps) {
  return (
    <Avatar
      color={color}
      size={size}
      variant={variant}
      className={className}
    >
      <Avatar.Image
        src={src}
        {...imgProps}
      />
      {
        children && (
          <Avatar.Fallback
            delayMs={delayMs}
          >
            {children}
          </Avatar.Fallback>
        )
      }
    </Avatar>
  )
}
