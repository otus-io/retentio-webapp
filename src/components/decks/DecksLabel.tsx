import clsx from 'clsx'
import { LucideIcon } from 'lucide-react'

export default function DecksIconLabel({
  icon: Icon,
  children: children,
  color = 'gray',
}: {
  icon: LucideIcon,
  children: React.ReactNode,
  color?: string
}) {
  return (
    <div className="flex items-center gap-1 text-muted">
      <div className={clsx('flex items-center justify-center p-1.5 rounded-md ', `bg-${color}-500/10`, `text-${color}-500`)}>
        <Icon className="size-3.5" strokeWidth={2.5} />
      </div>
      <span className="text-sm">
        {children}
      </span>
    </div>
  )
}
