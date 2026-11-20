'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppSelect from '@/components/app/AppSelect'
import DecksAction from '@/components/decks/DecksAction'
import { deckMenuActions } from '@/components/decks/deckMenuActions'
import DeckSharingSheet, { type DeckSheetKind } from '@/components/decks/DeckSharingSheet'
import LayoutPage from '@/components/layout/LayoutPage'
import StudyAnswerControls from '@/components/study/StudyAnswerControls'
import StudyCardMenu from '@/components/study/StudyCardMenu'
import StudyCardSide from '@/components/study/StudyCardSide'
import StudyDeleteCardDialog from '@/components/study/StudyDeleteCardDialog'
import StudyDueProgress from '@/components/study/StudyDueProgress'
import StudyFlipCard from '@/components/study/StudyFlipCard'
import StudyEditFactModal from '@/components/study/StudyEditFactModal'
import StudyReportModal from '@/components/study/StudyReportModal'
import { showSuccessToast } from '@/lib/ui'
import {
  deleteCardAction,
  getNextCardAction,
  hideCardAction,
  type NextCardResult,
  reviewCardAction,
} from '@/modules/cards/cards.action'
import { computeIntervalRange, type IntervalRange } from '@/modules/cards/cards.schema'
import type { Deck } from '@/modules/decks/decks.schema'
import type { Tag } from '@/modules/tags/tags.schema'
import { Card, Spinner } from '@heroui/react'
import { PartyPopper } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Key } from 'react'
import { useCallback, useEffect, useState, useTransition } from 'react'

const ALL_TAGS = '__all__'

interface StudySessionProps {
  deck: Deck
  /** Tags used on this deck's facts (what `tag_id` filters by) */
  tags: Tag[]
}

export default function StudySession({ deck, tags }: StudySessionProps) {
  const t = useTranslations('study')
  const tRoot = useTranslations()
  const imported = !!deck.source_deck_id
  const [tagId, setTagId] = useState<string>(ALL_TAGS)
  const [result, setResult] = useState<NextCardResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [interval, setIntervalSec] = useState(0)
  const [studied, setStudied] = useState(0)
  const [due, setDue] = useState<number | null>(null)
  /** Due count when the session started; progress is measured against it, as in the mobile app. */
  const [dueTarget, setDueTarget] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [sheet, setSheet] = useState<DeckSheetKind | null>(null)

  const [range, setRange] = useState<IntervalRange | null>(null)
  const card = result?.card?.card ?? null

  const load = useCallback((filter: string) => {
    startTransition(async () => {
      const res = await getNextCardAction(deck.id, filter === ALL_TAGS ? undefined : filter)
      if (!res.success || !res.data) {
        setError(String(res.error ?? ''))
        return
      }
      setError(null)
      setRevealed(false)
      setResult(res.data)
      const liveDue = res.data.stats?.due_cards
      if (liveDue != null) {
        setDue(liveDue)
        setDueTarget((prev) => prev ?? liveDue)
      }
      const next = res.data.card?.card
      const nextRange = next
        ? computeIntervalRange(Math.floor(Date.now() / 1000), next.last_review, next.due_date)
        : null
      setRange(nextRange)
      setIntervalSec(nextRange?.def ?? 0)
    })
  }, [deck.id])

  useEffect(() => {
    load(tagId)
  }, [load, tagId])

  const submit = useCallback((mutate: () => Promise<ActionState>, countAsStudied: boolean) => {
    startTransition(async () => {
      const res = await mutate()
      if (!res.success) {
        setError(String(res.error ?? ''))
        return
      }
      if (countAsStudied) setStudied((n) => n + 1)
      // Drop the reviewed card so a failed reload cannot submit it again.
      setResult(null)
      load(tagId)
    })
  }, [load, tagId])

  const handleNext = (cardId: string) => {
    submit(() => reviewCardAction({ deckId: deck.id, cardId, interval }), true)
  }

  const handleMenu = (cardId: string) => (key: Key) => {
    switch (key) {
      case 'hide':
        submit(() => hideCardAction({ deckId: deck.id, cardId }), false)
        break
      case 'edit':
        setIsEditOpen(true)
        break
      case 'report':
        setIsReportOpen(true)
        break
      case 'delete':
        setDeleteCardId(cardId)
        break
    }
  }

  const tagItems = [{ id: ALL_TAGS, name: t('all-tags') }, ...tags.map((e) => ({ id: e.id, name: e.name }))]
  const target = dueTarget ?? 0
  // Live progress toward the frozen target, with this session's reviews as a floor when new cards fall due.
  const liveCleared = due != null && due < target ? target - due : 0
  const cleared = Math.max(liveCleared, Math.min(studied, target))

  return (
    <LayoutPage
      // The deck menu sits in the header like the mobile study screen's app bar.
      actions={<DecksAction deck={deck} actions={deckMenuActions(deck)} onOpenSheet={setSheet} />}
      breadcrumbs={[
        { href: '/decks', title: tRoot('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/study`, title: t('title') },
      ]}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          {tagItems.length > 1 && (
            <AppSelect
              label={t('tag-filter')}
              items={tagItems}
              value={tagId}
              isDisabled={isPending}
              onChange={(key) => {
                // Due counts are narrowed by the tag, so a new filter starts a new progress target.
                setDue(null)
                setDueTarget(null)
                setStudied(0)
                setTagId(String(key ?? ALL_TAGS))
              }}
            />
          )}
          {card && (
            <StudyCardMenu isDisabled={isPending} imported={imported} onAction={handleMenu(card.id)} />
          )}
        </div>

        {dueTarget !== null && <StudyDueProgress cleared={cleared} target={target} />}

        <AppError error={error} />

        {!result && isPending && (
          <div className="flex justify-center py-16"><Spinner /></div>
        )}

        {!result && !isPending && error && (
          <AppButton variant="secondary" className="self-center" onPress={() => load(tagId)}>
            {tRoot('common.retry')}
          </AppButton>
        )}

        {result && !card && (
          <Card className="items-center gap-3 py-16 text-center">
            <PartyPopper className="size-10 text-accent" />
            <Card.Title>{t('caught-up-title')}</Card.Title>
            <Card.Description>{t('caught-up-description')}</Card.Description>
            <AppButton variant="secondary" isPending={isPending} onPress={() => load(tagId)}>
              {t('reload')}
            </AppButton>
          </Card>
        )}

        {card && range && (
          <>
            <StudyFlipCard
              key={card.id}
              revealed={revealed}
              onFlip={() => setRevealed((r) => !r)}
              label={t('flip-card')}
              front={<StudyCardSide entries={card.front} deckId={deck.id} factId={card.fact_id} imported={imported} />}
              back={<StudyCardSide entries={card.back} deckId={deck.id} factId={card.fact_id} imported={imported} />}
            />

            <StudyAnswerControls
              revealed={revealed}
              range={range}
              interval={interval}
              onIntervalChange={setIntervalSec}
              isPending={isPending}
              onShowAnswer={() => setRevealed(true)}
              onNext={() => handleNext(card.id)}
            />
          </>
        )}
      </div>

      <StudyDeleteCardDialog
        isOpen={!!deleteCardId}
        onClose={() => setDeleteCardId(null)}
        onConfirm={() => {
          const cardId = deleteCardId as string
          setDeleteCardId(null)
          submit(() => deleteCardAction({ deckId: deck.id, cardId }), false)
        }}
      />

      {sheet && <DeckSharingSheet deck={deck} kind={sheet} onClose={() => setSheet(null)} />}

      {card && isEditOpen && (
        <StudyEditFactModal
          deckId={deck.id}
          fields={deck.fields}
          factId={card.fact_id}
          isOpen={isEditOpen}
          setIsOpen={setIsEditOpen}
          onSaved={() => load(tagId)}
        />
      )}

      {card && imported && (
        <StudyReportModal
          key={card.fact_id}
          importDeckId={deck.id}
          factId={card.fact_id}
          isOpen={isReportOpen}
          setIsOpen={setIsReportOpen}
          onSuccess={() => showSuccessToast(t('report-sent'))}
        />
      )}
    </LayoutPage>
  )
}
