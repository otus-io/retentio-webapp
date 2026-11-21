'use client'

import AppButton from '@/components/app/AppButton'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import {
  getDeckUpdateFactAction,
  getDeckUpdatesSummaryAction,
  syncDeckWithDecisionsAction,
} from '@/modules/deck-sharing/deck-sharing.action'
import type {
  DeckUpdateFactDetail,
  DeckUpdatesSummaryResponseDTO,
  SyncFactDecision,
} from '@/modules/deck-sharing/deck-sharing.schema'
import type { Entry } from '@/modules/facts/facts.schema'
import { Spinner } from '@heroui/react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

type Summary = DeckUpdatesSummaryResponseDTO['data']
type Action = SyncFactDecision['action']

/** Same rule as the mobile app: a newer version or any content change. */
function hasUpdates(s: Summary) {
  return s.latest_version > s.source_version || hasContentChanges(s)
}

function hasContentChanges(s: Summary) {
  return !!(s.added_fact_ids?.length || s.removed_fact_ids?.length || s.edited_fact_ids?.length
    || s.media_change_count || s.card_template_change_count || s.description_changed)
}

function EntriesLine({ label, entries }: { label: string, entries?: Entry[] }) {
  const texts = (entries ?? []).map((e) => e.text?.trim()).filter(Boolean)
  return <p className="text-sm">{`${label}: ${texts.length ? texts.join(' · ') : '—'}`}</p>
}

interface FactTileProps {
  importId: string
  factId: string
  decision?: Action
  onDecision: (factId: string, action: Action) => void
}

/** One changed fact: tap to load its before/after; edited and removed facts get Accept / Reject. */
function FactTile({ importId, factId, decision, onDecision }: FactTileProps) {
  const t = useTranslations('updates')
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<DeckUpdateFactDetail | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await getDeckUpdateFactAction(importId, factId)
    setLoading(false)
    if (!res.success || !res.data) {
      showFailToast(String(res.error ?? '') || t('load-failed'))
      return
    }
    setDetail(res.data)
  }

  const toggle = () => {
    // Expanded without detail (a failed load): retry instead of collapsing.
    if (expanded && (detail || loading)) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (!detail && !loading) void load()
  }

  const hints = [detail?.aligned && t('aligned'), detail?.has_local_overlay && t('local-overlay')].filter(Boolean)
  // A local copy that differs from the author's is kept unless the user takes the update (the server's rule).
  const keepsLocal = !!detail?.has_local_overlay && !detail.aligned
  const decides = detail
    && (detail.kind === 'edited' || detail.kind === 'removed' || (detail.kind === 'added' && keepsLocal))
  const serverDefault = detail?.default_action ?? (keepsLocal ? 'keep' : 'accept')

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-2.5">
      <button type="button" className="flex items-center justify-between gap-2 text-left" onClick={toggle}>
        <span className="truncate font-mono text-xs">{factId}</span>
        {loading
          ? <Spinner size="sm" />
          : expanded ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
      </button>
      {expanded && detail && (
        <div className="flex flex-col gap-1">
          {hints.length > 0 && <p className="text-xs text-muted">{hints.join(' · ')}</p>}
          {detail.kind === 'edited'
            ? (
              <>
                <EntriesLine label={t('before')} entries={detail.before?.entries} />
                <EntriesLine label={t('after')} entries={detail.after?.entries} />
              </>
            )
            : <EntriesLine label={detail.kind === 'added' ? t('after') : t('before')} entries={detail.fact?.entries} />}
          {decides && (
            <div className="mt-1 flex gap-2">
              {(['accept', 'keep'] as const).map((action) => (
                <AppButton
                  key={action}
                  size="sm"
                  className="flex-1"
                  // Until the user picks, show what the server will do by default.
                  variant={(decision ?? serverDefault) === action ? 'primary' : 'secondary'}
                  onPress={() => onDecision(factId, action)}
                >
                  {action === 'accept' ? t('accept') : t('keep-local')}
                </AppButton>
              ))}
            </div>
          )}
        </div>
      )}
      {expanded && !detail && !loading && (
        <AppButton size="sm" variant="secondary" onPress={toggle}>{t('retry')}</AppButton>
      )}
    </div>
  )
}

/**
 * The check-updates sheet, as on mobile: versions and counts, an optional per-fact review where edited and
 * removed facts can be accepted or rejected, and Sync now.
 */
export default function DeckImportUpdatesSheet({ importId }: { importId: string }) {
  const t = useTranslations('updates')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<string, Action>>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    void getDeckUpdatesSummaryAction(importId).then((res) => {
      if (cancelled) return
      if (!res.success || !res.data) {
        // An empty string means no message; the fallback is picked at render.
        setError(String(res.error ?? ''))
        return
      }
      setError(null)
      setSummary(res.data)
      // Only facts the user explicitly decides are sent; the server applies its own defaults to the rest
      // (aligned → accept, removed with a local copy → keep), so local work is never discarded by default.
      setDecisions({})
      setReviewOpen(false)
    })
    return () => {
      cancelled = true
    }
  }, [importId, version])

  const decide = (factId: string, action: Action) => setDecisions((prev) => ({ ...prev, [factId]: action }))

  const sync = async (current: Summary) => {
    setSyncing(true)
    const res = await syncDeckWithDecisionsAction(
      importId,
      current.latest_version,
      Object.entries(decisions).map(([fact_id, action]) => ({ fact_id, action })),
    )
    setSyncing(false)
    if (!res.success) {
      showFailToast(String(res.error ?? '') || t('sync-failed'))
      return
    }
    setSummary({ source_version: current.latest_version, latest_version: current.latest_version })
    setDecisions({})
    setReviewOpen(false)
    showSuccessToast(t('sync-success'))
  }

  if (error !== null) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm">{error || t('load-failed')}</p>
        <AppButton variant="secondary" onPress={() => setVersion((v) => v + 1)}>{t('retry')}</AppButton>
      </div>
    )
  }
  if (!summary) return <div className="flex justify-center py-10"><Spinner /></div>

  const edited = summary.edited_fact_ids ?? []
  const removed = summary.removed_fact_ids ?? []
  const added = summary.added_fact_ids ?? []
  const tile = (factId: string) => (
    <FactTile
      key={factId}
      importId={importId}
      factId={factId}
      decision={decisions[factId]}
      onDecision={decide}
    />
  )
  const section = (title: string, ids: string[], tone: string) => ids.length > 0 && (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-semibold ${tone}`}>{title}</p>
      {ids.map(tile)}
    </div>
  )

  return (
    <div className="flex flex-col gap-3 px-1">
      <p className="font-medium">{t('version', { source: summary.source_version, latest: summary.latest_version })}</p>
      <p className="text-sm">
        {t('counts', {
          added: added.length,
          edited: edited.length,
          removed: removed.length,
          media: summary.media_change_count ?? 0,
        })}
      </p>
      {summary.change_summary && <p className="text-xs text-muted">{summary.change_summary}</p>}
      {summary.description_changed && <p className="text-sm">{t('description-changed')}</p>}
      {hasContentChanges(summary) && edited.length + removed.length + added.length > 0 && (
        <AppButton size="sm" variant="secondary" className="self-start" onPress={() => setReviewOpen((o) => !o)}>
          {reviewOpen ? t('hide-review') : t('review-changes')}
        </AppButton>
      )}
      {reviewOpen && (
        <div className="flex max-h-90 flex-col gap-3 overflow-y-auto">
          {section(t('edited-section', { count: edited.length }), edited, 'text-foreground')}
          {section(t('removed-section', { count: removed.length }), removed, 'text-danger')}
          {section(t('added-section', { count: added.length }), added, 'text-accent')}
          {!!summary.media_change_count && (
            <p className="text-sm font-medium">{t('media-section', { count: summary.media_change_count })}</p>
          )}
          {!!summary.card_template_change_count && (
            <p className="text-sm font-medium">
              {t('templates-section', { count: summary.card_template_change_count })}
            </p>
          )}
        </div>
      )}
      <AppButton fullWidth isPending={syncing} isDisabled={!hasUpdates(summary)} onPress={() => sync(summary)}>
        {hasUpdates(summary) ? t('sync-now') : t('up-to-date')}
      </AppButton>
    </div>
  )
}
