'use client'

import { formatPercent } from '@/utils/format'
import { useTranslations } from 'next-intl'

/** Today's due bar: cards cleared against the session's starting due count, like the mobile app. */
export default function StudyDueProgress({ cleared, target }: { cleared: number, target: number }) {
  const t = useTranslations('study')
  const percent = target > 0 ? Math.min(cleared / target, 1) * 100 : 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-default">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{t('todays-due')}</span>
        <span className="tabular-nums">{t('due-progress', { cleared, target, percent: formatPercent(percent) })}</span>
      </div>
    </div>
  )
}
