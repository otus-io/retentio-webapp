'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import { PublishPreviewSummary } from '@/components/decks/DeckPublishPanel'
import { publishDeckAction } from '@/modules/deck-sharing/deck-sharing.action'
import type { PublishPreview } from '@/modules/deck-sharing/deck-sharing.schema'
import type { Deck } from '@/modules/decks/decks.schema'
import { CircleCheck, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

interface DeckPublishSheetProps {
  deck: Deck
  preview: PublishPreview | null
}

/**
 * The publish sheet, laid out like the mobile app's: deck header, what will be published, one button, then a
 * "Published · vN" banner. A republish takes the next version automatically, as on mobile.
 */
export default function DeckPublishSheet({ deck, preview }: DeckPublishSheetProps) {
  const t = useTranslations()
  const isUpdate = deck.published_version > 0
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const title = isUpdate ? t('deck-menu.publish-update') : t('deck-menu.publish-deck')

  const publish = () => {
    const formData = new FormData()
    if (isUpdate) formData.set('version', String(deck.published_version + 1))
    setError(null)
    startTransition(async () => {
      const res = await publishDeckAction({ deckId: deck.id, currentVersion: deck.published_version }, null, formData)
      if (!res?.success) {
        setError(String(res?.error ?? '') || t('deck-menu.publish-failed'))
        return
      }
      setPublishedVersion(res.data?.publishedVersion ?? deck.published_version + 1)
    })
  }

  return (
    <div className="flex flex-col gap-5 px-1">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
          <Share2 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="truncate text-sm text-muted">{deck.name}</p>
        </div>
      </div>

      {publishedVersion !== null
        ? (
          <div className="flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/10 p-4">
            <CircleCheck className="size-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold text-accent">{t('deck-menu.published')}</p>
              <p className="text-xs text-muted tabular-nums">v{publishedVersion}</p>
            </div>
          </div>
        )
        : (
          <>
            {isUpdate
              ? preview && <PublishPreviewSummary preview={preview} />
              : <p className="text-sm text-muted">{t('deck-sharing.publish-description')}</p>}
            <AppError error={error} />
            <AppButton fullWidth isPending={isPending} onPress={publish}>
              {isUpdate ? t('deck-menu.publish-update') : t('deck-sharing.publish')}
            </AppButton>
          </>
        )}
    </div>
  )
}
