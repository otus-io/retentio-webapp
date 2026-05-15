import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-500' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-500' },
  rose: { bg: 'bg-rose-500/10', icon: 'text-rose-500' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-500' },
  cyan: { bg: 'bg-cyan-500/10', icon: 'text-cyan-500' },
  slate: { bg: 'bg-slate-500/10', icon: 'text-slate-500' },
  orange: { bg: 'bg-orange-500/10', icon: 'text-orange-500' },
  yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-500' },
} as const

export default function DecksIconLabel({
  icon: Icon,
  children,
  color = 'slate',
  className,
}: {
  icon: LucideIcon
  children: React.ReactNode
  color?: keyof typeof colorMap
  className?: string
}) {
  const c = colorMap[color] ?? colorMap.slate
  return (
    <motion.div
      className={clsx('group flex items-center gap-2', className)}
      variants={{
        hidden: { opacity: 0, x: -8 },
        visible: { opacity: 1, x: 0 },
      }}
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-lg size-7 shrink-0 transition-colors',
          c.bg,
          'group-hover:brightness-125',
        )}
      >
        <Icon className={clsx('size-3.5', c.icon)} strokeWidth={2.5} />
      </div>
      <span className="text-sm text-foreground/80">{children}</span>
    </motion.div>
  )
}
