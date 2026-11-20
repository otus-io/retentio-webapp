'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppTextarea from '@/components/app/AppTextarea'
import { showSuccessToast } from '@/lib/ui'
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
      const res = await addFactAction(deck.id, texts.map((text) => ({ text })), verified && !imported)
      if (!res.success) {
        setError(String(res.error ?? '') || t('failed'))
        return
      }
      setTexts(fields.map(() => ''))
      setVerified(false)
      showSuccessToast(t('success'))
    })
  }

  return (
    <div className="flex flex-col gap-4 px-1">
      {fields.map((field, i) => (
        <AppTextarea
          key={i}
          label={field}
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
