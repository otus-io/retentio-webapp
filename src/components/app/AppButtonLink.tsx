'use client'
import type { ButtonVariants } from '@heroui/react'
import type { ComponentProps } from 'react'
import { buttonVariants } from '@heroui/react'
import clsx from 'clsx'
import NextLink from 'next/link'

type AppLinkProps = ComponentProps<typeof NextLink> & ButtonVariants

export function AppButtonLink({
  children,
  className,
  fullWidth,
  isIconOnly,
  size,
  variant,
  ...rest
}: AppLinkProps) {
  return (
    <NextLink
      className={
        clsx(
          buttonVariants({
            fullWidth,
            isIconOnly,
            size,
            variant,
          }),
          className,
        )
      }
      {...rest}
    >
      {children}
    </NextLink>
  )
}
