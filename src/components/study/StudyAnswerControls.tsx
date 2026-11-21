'use client'

import AppButton from '@/components/app/AppButton'
import StudyIntervalSlider from '@/components/study/StudyIntervalSlider'
import { type IntervalRange, intervalToUnit } from '@/modules/cards/cards.schema'
import { useFormatter, useTranslations } from 'next-intl'

interface StudyAnswerControlsProps {
  revealed: boolean
  range: IntervalRange
  interval: number
  onIntervalChange: (seconds: number) => void
  isPending: boolean
  onShowAnswer: () => void
  onNext: () => void
}

/** Show answer on the front; the interval ruler and Next on the back. */
export default function StudyAnswerControls({
  revealed, range, interval, onIntervalChange, isPending, onShowAnswer, onNext,
}: StudyAnswerControlsProps) {
  const t = useTranslations('study')
  const formatter = useFormatter()
  const format = (seconds: number) => {
    const { value, unit } = intervalToUnit(seconds)
    return formatter.number(value, { style: 'unit', unit, unitDisplay: 'short' })
  }
  if (!revealed) {
    return (
      <AppButton className="self-center" onPress={onShowAnswer} isDisabled={isPending}>{t('show-answer')}</AppButton>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <StudyIntervalSlider
        range={range}
        value={interval}
        onChange={onIntervalChange}
        isDisabled={isPending}
        format={format}
      />
      <AppButton className="self-center" isPending={isPending} onPress={onNext}>{t('next')}</AppButton>
    </div>
  )
}
