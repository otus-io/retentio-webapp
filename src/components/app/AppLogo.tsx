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
  const logoText = APP_NAME.slice(1)

  return (
    <AppLink
      href="/"
      className={clsx('inline-flex items-center shrink-0 text-accent', className)}
    >
      {
        hideName !== true
          ? (
            <span className="inline-flex items-center gap-0.5 font-bold leading-none">
              <span className="sr-only">{APP_NAME}</span>
              <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                className="block h-10 w-auto shrink-0"
              />
              <span aria-hidden="true" className="text-[2.125rem] leading-none">{logoText}</span>
            </span>
          )
          : (
            <img
              src="/logo.svg"
              alt={APP_NAME}
              className="block h-8 w-auto shrink-0"
            />
          )
      }
    </AppLink>
  )
}
