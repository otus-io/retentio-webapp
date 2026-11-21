'use client'

import type { IntervalRange } from '@/modules/cards/cards.schema'
import { Slider } from '@heroui/react'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'

interface StudyIntervalSliderProps {
  range: IntervalRange
  value: number
  onChange: (seconds: number) => void
  isDisabled: boolean
  format: (seconds: number) => string
}

/** Hard ↔ Easy interval ruler with the chosen interval on the thumb, like the mobile app. */
export default function StudyIntervalSlider({ range, value, onChange, isDisabled, format }: StudyIntervalSliderProps) {
  const t = useTranslations('study')
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col text-xs">
        <span className="text-muted">{t('hard')}</span>
        <span className="text-[10px] text-muted/70 tabular-nums">{format(range.min)}</span>
      </div>
      <Slider
        aria-label={t('next-review')}
        className="flex-1 pt-8"
        minValue={range.min}
        maxValue={range.max}
        step={1}
        value={value}
        onChange={(v) => onChange(v as number)}
        isDisabled={isDisabled}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb>
            <span
              className={clsx(
                'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2',
                'whitespace-nowrap rounded-full bg-accent px-2 py-0.5',
                'text-xs font-medium text-accent-foreground tabular-nums',
              )}
            >
              {format(value)}
            </span>
          </Slider.Thumb>
        </Slider.Track>
      </Slider>
      <div className="flex flex-col items-end text-xs">
        <span className="text-muted">{t('easy')}</span>
        <span className="text-[10px] text-muted/70 tabular-nums">{format(range.max)}</span>
      </div>
    </div>
  )
}
