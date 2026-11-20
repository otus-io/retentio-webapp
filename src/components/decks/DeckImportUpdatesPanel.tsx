'use client'

import { Accordion, Card, Chip } from '@heroui/react'
import { ArrowRight, CheckCircle2, FilePenLine, FilePlus2, FileX2, Image, LayoutTemplate, RefreshCw } from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import { showSuccessToast } from '@/lib/ui'
import { syncImportedDeckAction } from '@/modules/deck-sharing/deck-sharing.action'
import type {
  DeckImportUpdatesResponseDTO,
  DeckUpdateFactSnapshot,
  DeckUpdateFactSummary,
} from '@/modules/deck-sharing/deck-sharing.schema'

type Updates = DeckImportUpdatesResponseDTO['data']

interface DeckImportUpdatesPanelProps {
  deckId: string
  updates: Updates
}

function FactSnapshot({ snapshot }: { snapshot?: DeckUpdateFactSnapshot }) {
  const t = useTranslations('deck-sharing')

  if (!snapshot) return <span className="text-xs text-muted-foreground">{t('fact-id-only')}</span>

  return (
    <div className="mt-2 grid gap-2">
      {snapshot.entries.map((entry, index) => (
        <div key={index} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            {t('entry-label', { number: index + 1 })}
          </div>
          {entry.text ? <p className="whitespace-pre-wrap break-words">{entry.text}</p> : null}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entry.audio ? <Chip size="sm">{t('audio')}</Chip> : null}
            {entry.image ? <Chip size="sm">{t('image')}</Chip> : null}
            {entry.video ? <Chip size="sm">{t('video')}</Chip> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function FactSummary({ item }: { item: DeckUpdateFactSummary }) {
  const t = useTranslations('deck-sharing')

  return (
    <div className="rounded-xl border border-border/50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{t('fact-id')}: {item.fact_id}</span>
        {item.has_local_overlay ? <Chip size="sm">{t('local-overlay')}</Chip> : null}
        {item.default_action ? <Chip size="sm">{t(`action-${item.default_action}`)}</Chip> : null}
      </div>
      <FactSnapshot snapshot={item.fact} />
    </div>
  )
}

export default function DeckImportUpdatesPanel({ deckId, updates }: DeckImportUpdatesPanelProps) {
  const t = useTranslations('deck-sharing')
  const [state, action, isPending] = useActionState(
    syncImportedDeckAction.bind(null, deckId),
    null,
  )
  const isLatest = updates.source_version === updates.latest_version
  const sections = [
    { id: 'added', label: t('added-facts'), icon: FilePlus2, count: updates.added_facts.length },
    { id: 'removed', label: t('removed-facts'), icon: FileX2, count: updates.removed_facts.length },
    { id: 'edited', label: t('edited-facts'), icon: FilePenLine, count: updates.edited_facts.length },
    { id: 'media', label: t('media-changes'), icon: Image, count: updates.media_changes.length },
    { id: 'templates', label: t('template-changes'), icon: LayoutTemplate, count: updates.card_template_changes?.length ?? 0 },
  ].filter((section) => section.count > 0)

  useEffect(() => {
    if (state?.success) showSuccessToast(t('sync-success'))
  }, [state?.success, t])

  return (
    <Card className="border-border/50" variant="default">
      <Card.Header>
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-full bg-accent/10 p-2 text-accent">
              {isLatest ? <CheckCircle2 className="size-4" /> : <RefreshCw className="size-4" />}
            </div>
            <div className="min-w-0">
              <Card.Title>{isLatest ? t('up-to-date-title') : t('updates-title')}</Card.Title>
              <Card.Description className="mt-1">
                {isLatest
                  ? t('up-to-date-description', { version: updates.source_version })
                  : t('updates-description', {
                    sourceVersion: updates.source_version,
                    latestVersion: updates.latest_version,
                  })}
              </Card.Description>
            </div>
          </div>
          {!isLatest
            ? (
              <form action={action}>
                <AppButton type="submit" isPending={isPending} icon={<RefreshCw className="size-4" />}>
                  {t('apply-updates')}
                </AppButton>
              </form>
            )
            : null}
        </div>
      </Card.Header>
      {!isLatest
        ? (
          <Card.Content className="space-y-4 pt-0">
            {updates.change_summary
              ? (
                <p className="rounded-lg bg-secondary/40 px-3 py-2 text-sm text-foreground/80">
                  {updates.change_summary}
                </p>
              )
              : null}
            <AppError error={state?.error} />
            <Accordion allowsMultipleExpanded variant="surface" className="rounded-xl border border-border/50">
              {sections.map(({ id, label, icon: Icon, count }) => (
                <Accordion.Item id={id} key={id}>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      <span className="flex flex-1 items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span>{t('section-count', { label, count })}</span>
                      </span>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="space-y-3">
                      {id === 'added' && updates.added_facts.map((item) => <FactSummary key={item.fact_id} item={item} />)}
                      {id === 'removed' && updates.removed_facts.map((item) => <FactSummary key={item.fact_id} item={item} />)}
                      {id === 'edited' && updates.edited_facts.map((item) => (
                        <div key={item.fact_id} className="rounded-xl border border-border/50 p-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{t('fact-id')}: {item.fact_id}</span>
                            {item.has_local_overlay ? <Chip size="sm">{t('local-overlay')}</Chip> : null}
                          </div>
                          <div className="grid items-start gap-3 md:grid-cols-[1fr_auto_1fr]">
                            <div><p className="text-sm font-medium">{t('before-change')}</p><FactSnapshot snapshot={item.before} /></div>
                            <ArrowRight className="mt-8 hidden size-4 text-muted-foreground md:block" />
                            <div><p className="text-sm font-medium">{t('after-change')}</p><FactSnapshot snapshot={item.after} /></div>
                          </div>
                        </div>
                      ))}
                      {id === 'media' && updates.media_changes.map((item) => (
                        <div key={item.media_id} className="rounded-xl border border-border/50 p-3 text-sm">
                          <p className="font-medium">{item.media_id}</p>
                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <p className="break-all">{t('before-change')}: {item.before_hash} · {item.before_bytes} B</p>
                            <p className="break-all">{t('after-change')}: {item.after_hash} · {item.after_bytes} B</p>
                          </div>
                        </div>
                      ))}
                      {id === 'templates' && updates.card_template_changes?.map((item) => (
                        <div key={item.fact_id} className="rounded-xl border border-border/50 p-3 text-sm">
                          <p className="font-medium">{t('fact-id')}: {item.fact_id}</p>
                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <p>{t('added-templates')}: {item.added_templates.map((template) => JSON.stringify(template)).join(', ') || '—'}</p>
                            <p>{t('removed-templates')}: {item.removed_templates.map((template) => JSON.stringify(template)).join(', ') || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Content>
        )
        : null}
    </Card>
  )
}
