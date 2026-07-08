import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import { APP_NAME } from '@/config'

interface AppLogoProps {
  className?: string;
}

export default function AppLogo({
  className,
}: AppLogoProps) {
  return (
    <AppLink
      href="/"
      aria-label={APP_NAME}
      className={clsx('flex items-center', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        className="h-9 w-auto"
      />
      <span
        aria-hidden
        className="font-bold text-2xl leading-none text-foreground"
      >
        {APP_NAME.slice(1)}
      </span>
    </AppLink>
  )
}
