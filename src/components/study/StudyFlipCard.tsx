'use client'

import { Card } from '@heroui/react'
import clsx from 'clsx'
import { RefreshCw } from 'lucide-react'
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

/**
 * Study card that flips around the Y axis, like the mobile app. A click anywhere on it flips it; keyboard and
 * screen-reader users get a dedicated flip button, so the controls inside the card stay reachable.
 */
export default function StudyFlipCard({ revealed, onFlip, label, front, back }: StudyFlipCardProps) {
  return (
    <div
      className="relative h-[min(60vh,28rem)] cursor-pointer perspective-[1200px]"
      onClick={(e) => {
        if (!isInteractive(e)) onFlip()
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
      <button
        type="button"
        aria-label={label}
        aria-pressed={revealed}
        className={clsx(
          'absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted transition-colors',
          'hover:bg-default hover:text-foreground',
          'outline-none focus-visible:ring-2 focus-visible:ring-focus',
        )}
        onClick={onFlip}
      >
        <RefreshCw className="size-4" />
      </button>
    </div>
  )
}
