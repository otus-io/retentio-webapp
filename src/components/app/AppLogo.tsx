import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import { APP_NAME } from '@/config'
import Image from 'next/image'

interface AppLogoProps {
  className?: string;
  hideName?: boolean;
}

export default function AppLogo({
  className,
  hideName,
}: AppLogoProps) {
  return (
    <AppLink
      href="/"
      className={clsx('inline-flex items-center gap-2 shrink-0 text-accent', className)}
    >
      {
        hideName !== true
          ? (
            <>
              <Image
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                className="block h-10 w-auto shrink-0 -translate-y-1"
                unoptimized
                width={473}
                height={402}
              />
              <span className="text-lg font-bold tracking-tight leading-none ">{APP_NAME}</span>
            </>
          )
          : (
            <Image
              src="/logo.svg"
              unoptimized
              alt={APP_NAME}
              width={473}
              height={402}
              className="block h-10 w-auto shrink-0"
            />
          )
      }
    </AppLink>
  )
}
