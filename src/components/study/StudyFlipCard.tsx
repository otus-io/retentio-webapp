'use client'

import { Card } from '@heroui/react'
import clsx from 'clsx'
import type { MouseEvent, ReactNode } from 'react'

interface StudyFlipCardProps {
  revealed: boolean
  onFlip: () => void
  label: string
  front: ReactNode
  back: ReactNode
}

/** Clicks on controls inside the card (audio, media) must not flip it. */
const isInteractive = (e: MouseEvent) => !!(e.target as HTMLElement).closest('button, a, input, audio, video')

/** Study card that flips around the Y axis on click, Enter or Space, like the mobile app. */
export default function StudyFlipCard({ revealed, onFlip, label, front, back }: StudyFlipCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={revealed}
      className={clsx(
        'h-[min(60vh,28rem)] cursor-pointer rounded-2xl perspective-[1200px]',
        'outline-none focus-visible:ring-2 focus-visible:ring-focus',
      )}
      onClick={(e) => {
        if (!isInteractive(e)) onFlip()
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
        e.preventDefault()
        onFlip()
      }}
    >
      <div
        className={clsx(
          'relative size-full transition-transform duration-240 transform-3d',
          revealed && 'rotate-y-180',
        )}
      >
        <Card className="absolute inset-0 justify-center overflow-y-auto py-6 backface-hidden">{front}</Card>
        <Card className="absolute inset-0 justify-center overflow-y-auto py-6 backface-hidden rotate-y-180">
          {revealed && back}
        </Card>
      </div>
    </div>
  )
}
