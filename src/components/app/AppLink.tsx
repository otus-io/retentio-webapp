'use client'
import type { ComponentProps } from 'react'
import clsx from 'clsx'
import NextLink from 'next/link'

interface AppLinkProps extends ComponentProps<typeof NextLink> {
  isActive?: boolean
}

export default function AppLink({
  children,
  className,
  isActive,
  ...rest
}: AppLinkProps) {
  return (
    <NextLink
      prefetch={false}
      className={
        clsx(
          isActive
            ? 'text-accent font-bold'
            : 'text-default-600 hover:text-default-900',
          className,
        )
      }
      {...rest}
    >
      {children}
    </NextLink>
  )
}
