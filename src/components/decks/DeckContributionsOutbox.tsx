'use client'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { type ContributionForm, ContributionFormModal } from '@/components/decks/DeckContributionsPanel'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import { EMAIL_NOT_VERIFIED_CODE } from '@/modules/auth/auth.schema'
import { sendToAuthor } from '@/modules/contributions/auto-send'
import { submitDeckContributionsBatchAction } from '@/modules/contributions/contributions.action'
import type { PendingDeckContribution, SentDeckContribution } from '@/modules/contributions/contributions.schema'
import {
  isPendingContribution,
  isSentContribution,
  pendingStorageKey,
  readContributions,
  sentStorageKey,
  writeContributions,
} from '@/modules/contributions/pending-contributions'
import type { Deck } from '@/modules/decks/decks.schema'
import { Checkbox, Label } from '@heroui/react'
import { FileText, PencilLine, Send, Tags } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'

function Row({ checked, onChange, children }: { checked: boolean, onChange: () => void, children: React.ReactNode }) {
  return (
    <Checkbox isSelected={checked} onChange={onChange} className="w-full rounded-lg border border-border/60 p-2.5">
      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
      <Checkbox.Content>{children}</Checkbox.Content>
    </Checkbox>
  )
}

/**
 * Unsent contributions for an imported deck, as on mobile: Pending / Sent, an optional message, send or
 * discard the selected items, clear all. Field renames and deck tags can be proposed from here too.
 */
export default function DeckContributionsOutbox({ deck }: { deck: Deck }) {
  const t = useTranslations('outbox')
  const tKinds = useTranslations('contributions')
  const tAuth = useTranslations('auth')
  const tSend = useTranslations('auto-send')
  const pendingKey = pendingStorageKey(deck.id)
  const sentKey = sentStorageKey(deck.id)
  const [tab, setTab] = useState<'pending' | 'sent'>('pending')
  const [pending, setPending] = useState<PendingDeckContribution[]>([])
  const [sent, setSent] = useState<SentDeckContribution[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<ContributionForm>(null)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    // Storage is only readable in the browser, after the first paint.
    const frame = requestAnimationFrame(() => {
      setPending(readContributions(pendingKey, isPendingContribution))
      setSent(readContributions(sentKey, isSentContribution))
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingKey, sentKey])

  const savePending = (next: PendingDeckContribution[]) => {
    setPending(next)
    writeContributions(pendingKey, next)
    setSelected((prev) => new Set([...prev].filter((id) => next.some((item) => item.id === id))))
  }

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (!next.delete(id)) next.add(id)
    return next
  })

  const send = () => {
    const chosen = pending.filter((item) => selected.has(item.id))
    startTransition(async () => {
      const result = await submitDeckContributionsBatchAction(
        { importDeckId: deck.id, contributions: chosen, message },
        null,
        new FormData(),
      )
      if (!result?.success || !result.data) {
        showFailToast(String(result?.error ?? '') || tKinds('submit-failed'))
        return
      }
      const { submitted, failed } = result.data
      const sentAt = new Date().toISOString()
      const nextSent = [...sent, ...submitted.map((item, i): SentDeckContribution => ({
        id: `${item.kind}:deck:${Date.now() + i}`,
        kind: item.kind,
        preview: chosen.find((c) => c.id === item.localId)?.preview ?? '',
        contributionId: item.contributionId,
        sentAt,
      }))]
      setSent(nextSent)
      writeContributions(sentKey, nextSent)
      savePending(pending.filter((item) => !submitted.some((s) => s.localId === item.id)))
      if (submitted.length > 0) {
        setMessage('')
        showSuccessToast(tKinds('batch-submit-success', { count: submitted.length }))
      }
      const other = failed.filter((item) => item.code !== EMAIL_NOT_VERIFIED_CODE)
      if (other.length < failed.length) showFailToast(tAuth('emailNotVerifiedError'))
      if (other.length > 0) showFailToast(tKinds('batch-submit-failed', { count: other.length }))
    })
  }

  const discardSelected = () => {
    const count = selected.size
    savePending(pending.filter((item) => !selected.has(item.id)))
    setNotice(t('discarded', { count }))
  }

  const clearAll = () => {
    const count = pending.length
    savePending([])
    setNotice(t('cleared', { count }))
  }

  const saveForm = (contribution: PendingDeckContribution) => {
    setForm(null)
    startTransition(async () => {
      // Sent to the author right away, as on mobile; it stays pending only if sending fails.
      const { unsent } = await sendToAuthor(deck.id, [contribution])
      const next = readContributions(pendingKey, isPendingContribution)
      setPending(next)
      setSelected((prev) => new Set([...prev].filter((id) => next.some((item) => item.id === id))))
      setSent(readContributions(sentKey, isSentContribution))
      setTab(unsent > 0 ? 'pending' : 'sent')
      if (unsent > 0) showFailToast(tSend('unsent'))
      else showSuccessToast(tSend('sent'))
    })
  }

  const allSelected = pending.length > 0 && pending.every((item) => selected.has(item.id))

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{t('hint')}</p>
        <div className="flex shrink-0 gap-1">
          <AppButton
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label={tKinds('field-rename-title')}
            isDisabled={isSubmitting}
            onPress={() => setForm('field_rename')}
          >
            <PencilLine className="size-4" />
          </AppButton>
          <AppButton
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label={tKinds('deck-tags-title')}
            isDisabled={isSubmitting}
            onPress={() => setForm('deck_tags')}
          >
            <Tags className="size-4" />
          </AppButton>
          <AppButton
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label={tKinds('description-title')}
            isDisabled={isSubmitting}
            onPress={() => setForm('description_edit')}
          >
            <FileText className="size-4" />
          </AppButton>
        </div>
      </div>

      <div className="flex gap-2">
        {(['pending', 'sent'] as const).map((key) => (
          <AppButton
            key={key}
            size="sm"
            className="flex-1"
            isDisabled={isSubmitting}
            variant={tab === key ? 'primary' : 'secondary'}
            onPress={() => setTab(key)}
          >
            {key === 'pending'
              ? t('tab-pending', { count: pending.length })
              : t('tab-sent', { count: sent.length })}
          </AppButton>
        ))}
      </div>

      {notice && <p className="text-sm text-muted">{notice}</p>}

      {tab === 'pending' && (pending.length === 0
        ? <p className="py-6 text-center text-sm text-muted">{t('empty')}</p>
        : (
          <>
            <AppInput
              aria-label={t('message-hint')}
              placeholder={t('message-hint')}
              value={message}
              onChange={setMessage}
            />
            <AppButton
              fullWidth
              isPending={isSubmitting}
              isDisabled={selected.size === 0}
              onPress={send}
              icon={<Send className="size-4" />}
            >
              {selected.size === 0 ? t('send-selected') : t('send-selected-count', { count: selected.size })}
            </AppButton>
            <div className="flex gap-2">
              <AppButton
                size="sm"
                variant="secondary"
                className="flex-1"
                isDisabled={isSubmitting || selected.size === 0}
                onPress={discardSelected}
              >
                {t('discard-selected')}
              </AppButton>
              <AppButton size="sm" variant="ghost" className="flex-1" isDisabled={isSubmitting} onPress={clearAll}>
                {t('clear-all')}
              </AppButton>
            </div>
            <Row
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(pending.map((item) => item.id)))}
            >
              <Label>{t('select-all', { count: pending.length })}</Label>
            </Row>
            {pending.map((item) => (
              <Row key={item.id} checked={selected.has(item.id)} onChange={() => toggle(item.id)}>
                <div className="flex min-w-0 flex-col">
                  <Label className="font-medium">{tKinds(item.kind)}</Label>
                  <span className="truncate text-xs text-muted">{item.preview}</span>
                </div>
              </Row>
            ))}
          </>
        ))}

      {tab === 'sent' && (sent.length === 0
        ? <p className="py-6 text-center text-sm text-muted">{t('sent-empty')}</p>
        : sent.map((item) => (
          <div key={item.id} className="flex flex-col rounded-lg border border-border/60 p-2.5">
            <span className="font-medium">{tKinds(item.kind)}</span>
            <span className="text-xs text-muted">{item.preview}</span>
            <span className="text-xs text-muted">{new Date(item.sentAt).toLocaleString()}</span>
          </div>
        )))}

      {form && (
        <ContributionFormModal
          deck={deck}
          kind={form}
          existing={pending.find((item) => item.kind === form)}
          onClose={() => setForm(null)}
          onSave={saveForm}
        />
      )}
    </div>
  )
}
