'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppTextarea from '@/components/app/AppTextarea'
import { sendFactEditsAndNotify } from '@/modules/contributions/auto-send'
import { getFactAction, updateFactEntriesAction } from '@/modules/facts/facts.action'
import type { Entry } from '@/modules/facts/facts.schema'
import { Modal, Spinner } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'

interface StudyEditFactModalProps {
  deckId: string
  fields: string[]
  factId: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onSaved: () => void
  /** Imported deck: the edit is also sent to the author */
  imported?: boolean
}

/** Edits the text of the studied card's fact; media in each entry is kept as is. */
export default function StudyEditFactModal(
  { deckId, fields, factId, isOpen, setIsOpen, onSaved, imported = false }: StudyEditFactModalProps,
) {
  const t = useTranslations('study')
  const tCommon = useTranslations('common')
  const tSend = useTranslations('auto-send')
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [texts, setTexts] = useState<string[]>([])
  /** Entries the fact had when loaded; fields past it are only added when filled in. */
  const [loadedCount, setLoadedCount] = useState(0)
  /** Imported deck: the fact is one the importer added, so the author gets it as a new fact */
  const [local, setLocal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Mounted only while open, so each open starts from a fresh load.
    let cancelled = false
    void getFactAction(deckId, factId).then((res) => {
      if (cancelled) return
      if (!res.success || !res.data) {
        setLoadFailed(true)
        if (res.error) setError(String(res.error))
        return
      }
      const loaded = res.data.entries
      setLoadedCount(loaded.length)
      setLocal(Boolean(res.data.local))
      const count = Math.max(fields.length, loaded.length)
      setEntries(Array.from({ length: count }, (_, i) => loaded[i] ?? {}))
      setTexts(Array.from({ length: count }, (_, i) => loaded[i]?.text ?? ''))
    })
    return () => {
      cancelled = true
    }
  }, [deckId, factId, fields.length])

  const handleSave = (current: Entry[]) => {
    const next = current.map(({ text: _text, ...rest }, i) => (texts[i].trim() ? { ...rest, text: texts[i] } : rest))
    // Keep the fact's own entries (empty ones hold their column); drop untouched trailing deck fields.
    while (next.length > loadedCount && Object.keys(next[next.length - 1]).length === 0) next.pop()
    startTransition(async () => {
      const res = await updateFactEntriesAction(deckId, factId, next)
      if (!res.success) {
        setError(res.error ? String(res.error) : t('edit-fact-save-failed'))
        return
      }
      setIsOpen(false)
      onSaved()
      if (!imported) return
      // An edit on an imported deck goes to the author right away, as on mobile.
      await sendFactEditsAndNotify(
        deckId,
        [{ factId, entries: next, local }],
        { sent: tSend('sent'), unsent: tSend('unsent') },
      )
    })
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen} isDismissable={!isPending}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger isDisabled={isPending} />
          <Modal.Header>
            <Modal.Heading>{t('edit-fact')}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4 px-1 py-2">
            {!entries && !loadFailed && <div className="flex justify-center py-8"><Spinner /></div>}
            {entries?.map((_, i) => (
              <AppTextarea
                key={i}
                label={fields[i] ?? `#${i + 1}`}
                value={texts[i]}
                onChange={(value) => setTexts((prev) => prev.map((v, j) => (j === i ? value : v)))}
              />
            ))}
            <AppError error={error ?? (loadFailed ? t('edit-fact-load-failed') : null)} />
          </Modal.Body>
          <Modal.Footer>
            <AppButton slot="close" variant="secondary" isDisabled={isPending}>{tCommon('cancel')}</AppButton>
            {entries && (
              <AppButton isPending={isPending} onPress={() => handleSave(entries)}>{tCommon('save')}</AppButton>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
