import { Avatar } from '@heroui/react'
import type { AvatarProps } from '@heroui/react'
import type { ComponentProps } from 'react'

export type AppAvatarProps = AvatarProps &
  ComponentProps<typeof Avatar.Image> &
  Pick<ComponentProps<typeof Avatar.Fallback>, 'delayMs'>

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
