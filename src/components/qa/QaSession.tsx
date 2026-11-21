'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import FactsAudioPlayButton from '@/components/facts/FactsAudioPlayButton'
import LayoutPage from '@/components/layout/LayoutPage'
import { showSuccessToast } from '@/lib/ui'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Fact } from '@/modules/facts/facts.schema'
import {
  getQaFactAction,
  getQualityStatsAction,
  putFactQualityAction,
  startQaWalkAction,
  submitQaReviewAction,
} from '@/modules/quality/quality.action'
import {
  type FactQuality,
  mergeQualityEntries,
  type QualityStats,
  scoreableAspects,
} from '@/modules/quality/quality.schema'
import { Card, Checkbox, Label, Spinner } from '@heroui/react'
import { CheckCircle2, Pencil, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

const prefsKey = (deckId: string) => `qa_columns_${deckId}`

function loadColumns(deckId: string, count: number): Set<number> {
  const all = new Set(Array.from({ length: Math.max(count, 1) }, (_, i) => i))
  try {
    const saved = JSON.parse(localStorage.getItem(prefsKey(deckId)) ?? 'null')
    if (!Array.isArray(saved)) return all
    const valid = saved.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < count)
    return valid.length ? new Set(valid) : all
  } catch {
    return all
  }
}

function saveColumns(deckId: string, columns: Set<number>) {
  try {
    localStorage.setItem(prefsKey(deckId), JSON.stringify([...columns].sort((a, b) => a - b)))
  } catch {
    // Column choice is a convenience; the walk works without it.
  }
}

interface QaSessionProps {
  deck: Deck
}

export default function QaSession({ deck }: QaSessionProps) {
  const t = useTranslations('qa')
  const tRoot = useTranslations()
  const router = useRouter()
  const imported = !!deck.source_deck_id
  const [picking, setPicking] = useState(true)
  const [columns, setColumns] = useState<Set<number>>(() => loadColumns(deck.id, deck.fields.length))
  const [factIds, setFactIds] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [fact, setFact] = useState<Fact | null>(null)
  const [quality, setQuality] = useState<FactQuality | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [stats, setStats] = useState<QualityStats | null>(null)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getQualityStatsAction(deck.id).then((res) => {
      if (res.success && res.data) setStats(res.data)
    })
  }, [deck.id])

  const fetchFact = useCallback(async (ids: string[], i: number) => {
    setFact(null)
    setQuality(null)
    setChecked(new Set())
    setIndex(i)
    const res = await getQaFactAction(deck.id, ids[i])
    if (!res.success || !res.data) {
      setError(String(res.error ?? ''))
      return
    }
    setError(null)
    setFact(res.data.fact)
    setQuality(res.data.quality)
  }, [deck.id])

  const loadFact = (ids: string[], i: number) => startTransition(() => fetchFact(ids, i))

  const startWalk = () => {
    saveColumns(deck.id, columns)
    startTransition(async () => {
      const res = await startQaWalkAction(deck.id, [...columns].sort((a, b) => a - b))
      if (!res.success || !res.data) {
        setError(String(res.error ?? ''))
        return
      }
      setError(null)
      setPicking(false)
      setStats(res.data.stats)
      setFactIds(res.data.factIds)
      setComplete(res.data.factIds.length === 0)
      if (res.data.factIds.length) await fetchFact(res.data.factIds, 0)
    })
  }

  const scoreable = useMemo(() => {
    const out = new Set<number>()
    fact?.entries.forEach((entry, i) => {
      if (columns.has(i) && scoreableAspects(entry).length) out.add(i)
    })
    return out
  }, [fact, columns])

  const allChecked = [...scoreable].every((i) => checked.has(i))
  const canAdvance = !!fact && !isPending && allChecked
  const hasNext = index + 1 < factIds.length

  const advance = async () => {
    if (hasNext) await fetchFact(factIds, index + 1)
    else setComplete(true)
  }

  const handleNext = (current: Fact) => {
    if (!scoreable.size) {
      startTransition(advance)
      return
    }
    const entries = mergeQualityEntries(quality, current.entries, checked, columns)
    startTransition(async () => {
      const res = await putFactQualityAction(deck.id, current.id, entries)
      if (!res.success) {
        setError(String(res.error ?? ''))
        return
      }
      const statsRes = await getQualityStatsAction(deck.id)
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      await advance()
    })
  }

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(i)) next.add(i)
      return next
    })
  }

  const shareWithAuthor = () => {
    startTransition(async () => {
      const res = await submitQaReviewAction(deck.id)
      if (!res.success || !res.data) {
        setError(String(res.error ?? ''))
        return
      }
      showSuccessToast(t('review-sent', { count: res.data.aspects }))
    })
  }

  const progress = stats && (
    <span className="text-sm text-muted tabular-nums">
      {t('progress', { verified: stats.verified_facts, total: stats.total_facts })}
    </span>
  )

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: tRoot('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/qa`, title: t('title') },
      ]}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <AppError error={error} />

        {picking && (
          <Card className="gap-4">
            <Card.Header>
              <Card.Title>{t('pick-columns')}</Card.Title>
              <Card.Description>{t('pick-columns-description')}</Card.Description>
            </Card.Header>
            <Card.Content className="gap-2">
              {deck.fields.map((field, i) => (
                <Checkbox
                  key={i}
                  isSelected={columns.has(i)}
                  isDisabled={isPending}
                  onChange={() => setColumns((prev) => {
                    const next = new Set(prev)
                    if (!next.delete(i)) next.add(i)
                    return next
                  })}
                >
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  <Checkbox.Content><Label>{field}</Label></Checkbox.Content>
                </Checkbox>
              ))}
            </Card.Content>
            <Card.Footer className="items-center justify-between">
              {progress}
              <AppButton isPending={isPending} isDisabled={!columns.size} onPress={startWalk}>{t('start')}</AppButton>
            </Card.Footer>
          </Card>
        )}

        {!picking && complete && (
          <Card className="items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <Card.Title>{t('complete-title')}</Card.Title>
            {progress}
            <div className="flex flex-wrap justify-center gap-2">
              <AppButton variant="secondary" onPress={() => { setPicking(true); setComplete(false) }}>
                {t('change-columns')}
              </AppButton>
              {imported && (
                <AppButton icon={<Send className="size-4" />} isPending={isPending} onPress={shareWithAuthor}>
                  {t('share-with-author')}
                </AppButton>
              )}
            </div>
          </Card>
        )}

        {!picking && !complete && (
          <Card className="min-h-80">
            <Card.Header className="flex-row items-center justify-between">
              <span className="text-sm text-muted tabular-nums">
                {t('position', { current: index + 1, total: factIds.length })}
              </span>
              {progress}
            </Card.Header>
            <Card.Content className="gap-4 py-4">
              {!fact && isPending && <div className="flex justify-center py-12"><Spinner /></div>}
              {!fact && !isPending && error && (
                <AppButton variant="secondary" className="self-center" onPress={() => loadFact(factIds, index)}>
                  {tRoot('common.retry')}
                </AppButton>
              )}
              {fact?.entries.map((entry, i) => columns.has(i) && (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-border/50 pb-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-muted">{deck.fields[i]}</span>
                    <div className="flex items-center gap-2">
                      {entry.text && <span className="whitespace-pre-wrap text-lg">{entry.text}</span>}
                      {entry.audio && (
                        <FactsAudioPlayButton mediaId={entry.audio} deckId={deck.id} factId={fact.id} imported={imported} />
                      )}
                    </div>
                  </div>
                  {scoreable.has(i) && (
                    <Checkbox isSelected={checked.has(i)} onChange={() => toggle(i)} isDisabled={isPending}>
                      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                      <Checkbox.Content><Label>{t('verified')}</Label></Checkbox.Content>
                    </Checkbox>
                  )}
                </div>
              ))}
            </Card.Content>
            <Card.Footer className="flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                <AppButton
                  variant="tertiary"
                  isDisabled={index === 0 || isPending}
                  onPress={() => loadFact(factIds, index - 1)}
                >
                  {t('prev')}
                </AppButton>
                <AppButton
                  variant="tertiary"
                  isDisabled={isPending}
                  onPress={() => (hasNext ? loadFact(factIds, index + 1) : setComplete(true))}
                >
                  {t('skip')}
                </AppButton>
                <AppButton
                  variant="tertiary"
                  icon={<Pencil className="size-4" />}
                  onPress={() => router.push(`/decks/${deck.id}/facts`)}
                >
                  {t('edit')}
                </AppButton>
              </div>
              <AppButton isPending={isPending} isDisabled={!canAdvance} onPress={() => handleNext(fact as Fact)}>
                {hasNext ? t('verify-next') : t('verify-finish')}
              </AppButton>
            </Card.Footer>
          </Card>
        )}
      </div>
    </LayoutPage>
  )
}
