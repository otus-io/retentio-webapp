'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppSelect from '@/components/app/AppSelect'
import LayoutPage from '@/components/layout/LayoutPage'
import StudyCardSide from '@/components/study/StudyCardSide'
import StudyReportModal from '@/components/study/StudyReportModal'
import { showSuccessToast } from '@/lib/ui'
import {
  deleteCardAction,
  getNextCardAction,
  hideCardAction,
  type NextCardResult,
  reviewCardAction,
} from '@/modules/cards/cards.action'
import { computeIntervalRange, type IntervalRange, intervalToUnit } from '@/modules/cards/cards.schema'
import type { Deck } from '@/modules/decks/decks.schema'
import { AlertDialog, Card, Dropdown, Label, Slider, Spinner } from '@heroui/react'
import { EllipsisVertical, EyeOff, Flag, PartyPopper, Pencil, Trash2 } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { Key } from 'react'
import { useCallback, useEffect, useState, useTransition } from 'react'

const ALL_TAGS = '__all__'

interface StudySessionProps {
  deck: Deck
}

export default function StudySession({ deck }: StudySessionProps) {
  const t = useTranslations('study')
  const tRoot = useTranslations()
  const format = useFormatter()
  const router = useRouter()
  const imported = !!deck.source_deck_id
  const [tagId, setTagId] = useState<string>(ALL_TAGS)
  const [result, setResult] = useState<NextCardResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [interval, setIntervalSec] = useState(0)
  const [studied, setStudied] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

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
        router.push(`/decks/${deck.id}/facts`)
        break
      case 'report':
        setIsReportOpen(true)
        break
      case 'delete':
        setDeleteCardId(cardId)
        break
    }
  }

  const formatInterval = (seconds: number) => {
    const { value, unit } = intervalToUnit(seconds)
    return format.number(value, { style: 'unit', unit, unitDisplay: 'long' })
  }

  const tagItems = [{ id: ALL_TAGS, name: t('all-tags') }, ...(deck.tags ?? []).map((e) => ({ id: e.id, name: e.name }))]
  const due = result?.stats?.due_cards

  return (
    <LayoutPage
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
              onChange={(key) => setTagId(String(key ?? ALL_TAGS))}
            />
          )}
          <span className="text-sm text-muted tabular-nums">
            {t('progress', { studied, due: due ?? 0 })}
          </span>
        </div>

        <AppError error={error} />

        {!result && isPending && (
          <div className="flex justify-center py-16"><Spinner /></div>
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
          <Card className="min-h-80">
            <Card.Header className="flex-row items-center justify-end">
              <Dropdown>
                <Dropdown.Trigger aria-label={t('card-options')}>
                  <EllipsisVertical className="size-4 text-muted" />
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu onAction={handleMenu(card.id)}>
                    <Dropdown.Item id="hide" textValue={t('hide-card')}>
                      <EyeOff className="size-3.5 text-muted-foreground" />
                      <Label>{t('hide-card')}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="edit" textValue={t('edit-fact')}>
                      <Pencil className="size-3.5 text-muted-foreground" />
                      <Label>{t('edit-fact')}</Label>
                    </Dropdown.Item>
                    {imported
                      ? (
                        <Dropdown.Item id="report" textValue={t('report-issue')}>
                          <Flag className="size-3.5 text-muted-foreground" />
                          <Label>{t('report-issue')}</Label>
                        </Dropdown.Item>
                      )
                      : null}
                    <Dropdown.Item id="delete" textValue={t('delete-card')} variant="danger">
                      <Trash2 className="size-3.5 text-danger" />
                      <Label>{t('delete-card')}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </Card.Header>
            <Card.Content className="gap-6 py-6">
              <StudyCardSide entries={card.front} deckId={deck.id} factId={card.fact_id} imported={imported} />
              {revealed && card.back.length > 0 && (
                <>
                  <hr className="border-border" />
                  <StudyCardSide entries={card.back} deckId={deck.id} factId={card.fact_id} imported={imported} />
                </>
              )}
            </Card.Content>
            <Card.Footer className="flex-col items-stretch gap-4">
              {revealed
                ? (
                  <>
                    <Slider
                      aria-label={t('next-review')}
                      minValue={range.min}
                      maxValue={range.max}
                      step={1}
                      value={interval}
                      onChange={(v) => setIntervalSec(v as number)}
                      isDisabled={isPending}
                    >
                      <div className="flex justify-between text-sm">
                        <Label>{t('next-review')}</Label>
                        <span className="font-medium tabular-nums">{formatInterval(interval)}</span>
                      </div>
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                      </Slider.Track>
                      <div className="flex justify-between text-xs text-muted">
                        <span>{formatInterval(range.min)}</span>
                        <span>{formatInterval(range.max)}</span>
                      </div>
                    </Slider>
                    <AppButton isPending={isPending} onPress={() => handleNext(card.id)}>{t('next')}</AppButton>
                  </>
                )
                : (
                  <AppButton onPress={() => setRevealed(true)} isDisabled={isPending}>{t('show-answer')}</AppButton>
                )}
            </Card.Footer>
          </Card>
        )}
      </div>

      <AlertDialog.Backdrop isOpen={!!deleteCardId} onOpenChange={() => setDeleteCardId(null)}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Heading>{t('delete-card')}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>{t('delete-card-confirm')}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AppButton slot="close" variant="tertiary">{tRoot('common.cancel')}</AppButton>
              <AppButton
                variant="danger"
                onPress={() => {
                  const cardId = deleteCardId as string
                  setDeleteCardId(null)
                  submit(() => deleteCardAction({ deckId: deck.id, cardId }), false)
                }}
              >
                {t('delete-card')}
              </AppButton>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

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
