'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppTextarea from '@/components/app/AppTextarea'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import { factContribution, sendToAuthor } from '@/modules/contributions/auto-send'
import { previewFromEntries } from '@/modules/contributions/pending-contributions'
import type { Deck } from '@/modules/decks/decks.schema'
import { addFactAction } from '@/modules/facts/facts.action'
import { Checkbox, Label } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

/**
 * Add facts one at a time, as on mobile: one box per deck field, an optional sign-off on the author's own deck,
 * and the form clears after each save so the next fact can be typed straight away.
 */
export default function DeckAddFact({ deck }: { deck: Deck }) {
  const t = useTranslations('add-fact')
  const tSend = useTranslations('auto-send')
  const fields = deck.fields.length ? deck.fields : ['#1']
  const imported = !!deck.source_deck_id
  const [texts, setTexts] = useState<string[]>(() => fields.map(() => ''))
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    if (texts.some((text) => !text.trim())) {
      setError(t('needs-content'))
      return
    }
    setError(null)
    startTransition(async () => {
      const entries = texts.map((text) => ({ text: text.trim() }))
      const res = await addFactAction(deck.id, entries, verified && !imported, imported)
      if (!res.success) {
        setError(String(res.error ?? '') || t('failed'))
        return
      }
      setTexts(fields.map(() => ''))
      setVerified(false)
      const newFactIds = res.data?.newFactIds ?? []
      if (res.data?.idsUnknown) {
        // Saved, but the new fact could not be identified, so it cannot be sent or queued.
        showFailToast(tSend('fact-added-not-sent'))
        return
      }
      if (!imported || newFactIds.length === 0) {
        showSuccessToast(t('success'))
        return
      }
      // A new fact on an imported deck goes to the author right away, as on mobile.
      const preview = previewFromEntries(entries)
      const { unsent } = await sendToAuthor(deck.id, newFactIds.map((id) => factContribution('fact_add', id, preview)))
      if (unsent > 0) showFailToast(tSend('fact-added-unsent'))
      else showSuccessToast(tSend('fact-added-sent'))
    })
  }

  return (
    <div className="flex flex-col gap-4 px-1">
      {fields.map((field, i) => (
        <AppTextarea
          key={i}
          label={field}
          isDisabled={isPending}
          value={texts[i]}
          onChange={(value) => setTexts((prev) => prev.map((v, j) => (j === i ? value : v)))}
        />
      ))}
      {/* The server only records sign-offs on the author's own deck. */}
      {!imported && (
        <Checkbox isSelected={verified} onChange={setVerified} isDisabled={isPending}>
          <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
          <Checkbox.Content><Label>{t('mark-verified')}</Label></Checkbox.Content>
        </Checkbox>
      )}
      <AppError error={error} />
      <AppButton fullWidth isPending={isPending} onPress={save}>{t('submit')}</AppButton>
    </div>
  )
}
