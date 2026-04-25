import clsx from 'clsx'
import { LucideIcon } from 'lucide-react'

export default function DecksIconLabel({
  icon: Icon,
  children: children,
  className,
}: {
  icon: LucideIcon,
  children: React.ReactNode,
  color?: string,
  className?: string
}) {
  return (
    <div className={clsx('flex items-center gap-1 text-muted', className)}>
      <div className={clsx('flex items-center justify-center rounded-md ')}>
        <Icon className="size-3.5" strokeWidth={2.5} />
      </div>
      <span className="text-sm">
        {children}
      </span>
    </div>
  )
}
