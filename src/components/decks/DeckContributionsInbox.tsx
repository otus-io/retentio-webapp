'use client'

import AppButton from '@/components/app/AppButton'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import {
  acceptContributionAction,
  getOpenContributionsAction,
  updateContributionStatusAction,
} from '@/modules/contributions/contributions.action'
import type { Contribution } from '@/modules/contributions/contributions.schema'
import type { Entry } from '@/modules/facts/facts.schema'
import { AlertDialog, Spinner } from '@heroui/react'
import { Inbox } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

const canAccept = (c: Contribution) => c.type !== 'report'

/** Most pages Accept all walks through before confirming (50 contributions each) */
const MAX_WALK_PAGES = 40

/** Entry texts joined like the mobile app; a dash when there is nothing to show. */
function entriesPreview(entries: Entry[] = []) {
  const parts = entries.map((e) => e.text?.trim()).filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

function DiffLabel({ children, accent = false }: { children: string, accent?: boolean }) {
  return <p className={`text-xs font-semibold ${accent ? 'text-accent' : 'text-muted'}`}>{children}</p>
}

/** What the contribution changes: entries before/after (or proposed/reported), field names and tags. */
function ContributionDiff({ c }: { c: Contribution }) {
  const t = useTranslations('inbox')
  const before = c.reported_fact?.entries ?? []
  const after = c.proposed_entries ?? []
  const beforeAfter = c.type === 'fact_edit' || (before.length > 0 && after.length > 0)
  const proposedOnly = c.type === 'fact_add' && after.length > 0 && before.length === 0
  const reportedOnly = c.type === 'report' && before.length > 0 && after.length === 0
  const fields = !!(c.proposed_fields?.length || c.reported_fields?.length)
  const tags = !!(c.add_tags?.length || c.remove_tags?.length || c.reported_tags?.length)
  if (!beforeAfter && !proposedOnly && !reportedOnly && !fields && !tags) return null
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-default/50 p-2.5 text-sm">
      {beforeAfter && (
        <>
          <div>
            <DiffLabel>{t('before')}</DiffLabel>
            <p>{entriesPreview(before)}</p>
          </div>
          <div>
            <DiffLabel accent>{t('after')}</DiffLabel>
            <p className="font-semibold">{entriesPreview(after)}</p>
          </div>
        </>
      )}
      {proposedOnly && (
        <div>
          <DiffLabel accent>{t('proposed')}</DiffLabel>
          <p>{entriesPreview(after)}</p>
        </div>
      )}
      {reportedOnly && (
        <div>
          <DiffLabel>{t('reported')}</DiffLabel>
          <p>{entriesPreview(before)}</p>
        </div>
      )}
      {fields && (
        <div>
          <DiffLabel>{t('fields')}</DiffLabel>
          <p>{`${c.reported_fields?.join(' · ') || '—'} → ${c.proposed_fields?.join(' · ') || '—'}`}</p>
        </div>
      )}
      {tags && (
        <div>
          <DiffLabel>{t('tags')}</DiffLabel>
          {!!c.reported_tags?.length && <p>{`${t('before')}: ${c.reported_tags.join(', ')}`}</p>}
          {!!c.add_tags?.length && <p>{`+ ${c.add_tags.join(', ')}`}</p>}
          {!!c.remove_tags?.length && <p>{`− ${c.remove_tags.join(', ')}`}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * The author's contributions inbox, as on mobile: open contributions as cards with their changes and
 * Accept / Dismiss / Resolve, plus Accept all and Load more.
 */
export default function DeckContributionsInbox({ sourceDeckId }: { sourceDeckId: string }) {
  const t = useTranslations('inbox')
  const tTypes = useTranslations('author-contributions')
  const [items, setItems] = useState<Contribution[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [progress, setProgress] = useState<{ done: number, total: number } | null>(null)
  const [version, setVersion] = useState(0)
  const [preparing, setPreparing] = useState(false)
  /** The last walk stopped with contributions still open (cap reached or the server stopped early) */
  const [walkCutShort, setWalkCutShort] = useState(false)
  // Cleared on close, so a walk still running then is dropped (another deck remounts the inbox via its key).
  const activeDeck = useRef<string | null>(sourceDeckId)
  useEffect(() => {
    activeDeck.current = sourceDeckId
    return () => {
      activeDeck.current = null
    }
  }, [sourceDeckId])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  /**
   * Where the next page starts in the server's open list. It grows by every page fetched and shrinks by one for
   * each card handled here (it leaves the open list), so it stays right even after repeats are dropped.
   */
  const served = useRef(0)

  useEffect(() => {
    let cancelled = false
    void getOpenContributionsAction(sourceDeckId).then((res) => {
      if (cancelled) return
      if (!res.success || !res.data) {
        // An empty string means no message; the fallback is picked at render.
        setError(String(res.error ?? ''))
        return
      }
      setError(null)
      served.current = res.data.contributions.length
      setItems(res.data.contributions)
      setHasMore(res.data.hasMore)
    })
    return () => {
      cancelled = true
    }
  }, [sourceDeckId, version])

  const loadMore = async (current: Contribution[]) => {
    setLoadingMore(true)
    const res = await getOpenContributionsAction(sourceDeckId, served.current)
    setLoadingMore(false)
    if (!res.success || !res.data) {
      showFailToast(String(res.error ?? '') || t('load-failed'))
      return
    }
    served.current += res.data.contributions.length
    // The list can shift between pages, so never show a contribution twice.
    const seen = new Set(current.map((c) => c.id))
    setItems([...current, ...res.data.contributions.filter((c) => !seen.has(c.id))])
    setHasMore(res.data.hasMore)
  }

  const accept = (contributionId: string) =>
    acceptContributionAction({ sourceDeckId, contributionId }, null, new FormData())

  const act = async (c: Contribution, op: 'accept' | 'dismissed' | 'resolved') => {
    setBusyId(c.id)
    const res = op === 'accept'
      ? await accept(c.id)
      : await updateContributionStatusAction(
        { sourceDeckId, contributionId: c.id, data: { status: op } },
        null,
        new FormData(),
      )
    setBusyId(null)
    if (!res?.success) {
      showFailToast(String(res?.error ?? '') || t('operation-failed'))
      return
    }
    showSuccessToast(op === 'accept' ? t('accepted') : t('updated'))
    served.current = Math.max(0, served.current - 1)
    // Drop the handled card in place, keeping any pages already loaded.
    const remaining = (items ?? []).filter((item) => item.id !== c.id)
    // Everything loaded is handled but more are open: show the spinner and fetch them instead of "empty".
    if (remaining.length === 0 && hasMore) {
      setItems(null)
      reload()
    } else {
      setItems(remaining)
    }
  }

  // Accept all covers every open contribution: load the remaining pages before asking to confirm.
  const prepareAcceptAll = async (current: Contribution[]) => {
    const deckId = sourceDeckId
    let all = current
    let more = hasMore
    let failure: string | null = null
    let serverHasMore = more
    let repeatPages = 0
    setPreparing(true)
    for (let pages = 0; more; pages += 1) {
      const res = await getOpenContributionsAction(deckId, served.current)
      if (activeDeck.current !== deckId) return
      if (!res.success || !res.data) {
        failure = String(res.error ?? '') || t('load-failed')
        break
      }
      // The list can shift while paging (others accept or dismiss), so skip anything already loaded.
      const seen = new Set(all.map((c) => c.id))
      const fresh = res.data.contributions.filter((c) => !seen.has(c.id))
      all = [...all, ...fresh]
      served.current += res.data.contributions.length
      serverHasMore = res.data.hasMore
      // Step past a page of repeats (served already moved on), but two in a row means the server is not moving
      // on; also stop on an empty page or at the cap.
      repeatPages = fresh.length === 0 ? repeatPages + 1 : 0
      more = res.data.hasMore && res.data.contributions.length > 0 && repeatPages < 2 && pages + 1 < MAX_WALK_PAGES
    }
    setPreparing(false)
    // Keep what loaded, even when a page failed, so a retry continues from here.
    setItems(all)
    // More may still be open (a failed or cut-short walk): keep the count a lower bound and Load more available.
    setHasMore(failure !== null || serverHasMore)
    setWalkCutShort(serverHasMore)
    if (failure !== null) {
      showFailToast(failure)
      return
    }
    setConfirmAll(true)
  }

  const acceptAll = async (toAccept: Contribution[]) => {
    setConfirmAll(false)
    setProgress({ done: 0, total: toAccept.length })
    let sent = 0
    let lastError = ''
    for (const [i, c] of toAccept.entries()) {
      const res = await accept(c.id)
      if (res?.success) sent += 1
      else lastError = String(res?.error ?? '')
      setProgress({ done: i + 1, total: toAccept.length })
    }
    setProgress(null)
    const failed = toAccept.length - sent
    if (failed === 0) showSuccessToast(t('accept-all-success', { count: sent }))
    else if (sent > 0) showFailToast(t('accept-all-partial', { sent, failed }))
    else showFailToast(lastError || t('operation-failed'))
    // Clear the accepted cards while the list reloads, so none of them can be acted on again.
    setItems(null)
    reload()
  }

  if (error !== null) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm">{error || t('load-failed')}</p>
        <AppButton variant="secondary" onPress={reload}>{t('retry')}</AppButton>
      </div>
    )
  }
  if (!items) return <div className="flex justify-center py-10"><Spinner /></div>
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted">
        <Inbox className="size-10 opacity-40" />
        <p className="text-sm text-foreground">{t('empty')}</p>
      </div>
    )
  }

  const acceptable = items.filter(canAccept)
  // Card actions and Load more never overlap, so neither works from a stale list.
  const busy = busyId !== null || progress !== null || loadingMore || preparing

  return (
    <div className="flex flex-col gap-3 px-1">
      {acceptable.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <AppButton
            size="sm"
            fullWidth
            isPending={progress !== null || preparing}
            isDisabled={busy}
            onPress={() => prepareAcceptAll(items)}
          >
            {/* More pages are still on the server: the count is a lower bound until they load. */}
            {t('accept-all', { count: hasMore ? `${acceptable.length}+` : acceptable.length })}
          </AppButton>
          {progress && <p className="text-center text-xs text-muted">{t('accept-all-progress', progress)}</p>}
        </div>
      )}
      {items.map((c) => (
        <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-border/60 p-3">
          <div>
            <p className="font-semibold">{tTypes(`types.${c.type}`)}</p>
            <p className="text-xs text-muted">
              {[c.reporter, c.fact_id, c.source_version > 0 && `v${c.source_version}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {c.message && <p className="text-sm">{c.message}</p>}
          <ContributionDiff c={c} />
          <div className="flex gap-2">
            {canAccept(c) && (
              <AppButton
                size="sm"
                className="flex-1"
                isPending={busyId === c.id}
                isDisabled={busy}
                onPress={() => act(c, 'accept')}
              >
                {t('accept')}
              </AppButton>
            )}
            <AppButton
              size="sm"
              variant="secondary"
              className="flex-1"
              isDisabled={busy}
              onPress={() => act(c, 'dismissed')}
            >
              {t('dismiss')}
            </AppButton>
            <AppButton
              size="sm"
              variant="ghost"
              className="flex-1"
              isDisabled={busy}
              onPress={() => act(c, 'resolved')}
            >
              {t('resolve')}
            </AppButton>
          </div>
        </div>
      ))}
      {hasMore && (
        <AppButton
          size="sm"
          variant="secondary"
          isPending={loadingMore}
          isDisabled={busy}
          onPress={() => loadMore(items)}
        >
          {t('load-more')}
        </AppButton>
      )}

      <AlertDialog.Backdrop isOpen={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.Header>
              <AlertDialog.Heading>{t('accept-all-confirm-title')}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>{t('accept-all-confirm-message', { count: acceptable.length })}</p>
              {/* Be clear that this accepts what was loaded, not every open contribution. */}
              {walkCutShort && <p className="mt-2 text-sm text-muted">{t('accept-all-more-open')}</p>}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AppButton slot="close" variant="ghost">{t('cancel')}</AppButton>
              <AppButton onPress={() => acceptAll(acceptable)}>{t('accept')}</AppButton>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  )
}
