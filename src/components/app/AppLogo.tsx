import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import { APP_NAME } from '@/config'

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
              <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                className="block h-10 w-auto shrink-0"
              />
              <span className="text-lg font-bold tracking-tight leading-none translate-y-2">{APP_NAME}</span>
            </>
          )
          : (
            <img
              src="/logo.svg"
              alt={APP_NAME}
              className="block h-10 w-auto shrink-0"
            />
          )
      }
    </AppLink>
  )
}
