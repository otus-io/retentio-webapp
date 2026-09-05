'use client'

import type { Selection } from '@heroui/react'
import { Card, Checkbox, Chip, EmptyState, Modal, Table, Tabs } from '@heroui/react'
import { Check, Inbox, PencilLine, Tags, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import { submitDeckContributionsBatchAction } from '@/modules/contributions/contributions.action'
import type { PendingDeckContribution, SentDeckContribution } from '@/modules/contributions/contributions.schema'
import type { Deck } from '@/modules/decks/decks.schema'

interface DeckContributionsPanelProps { deck: Deck }
type ContributionForm = PendingDeckContribution['kind'] | null

function parseTags(value: string) {
  return [...new Set(value.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean))]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isPendingContribution(value: unknown): value is PendingDeckContribution {
  if (!isRecord(value) || typeof value.preview !== 'string' || typeof value.savedAt !== 'string') return false
  if (value.id === 'deck_tags' && value.kind === 'deck_tags') {
    return isStringArray(value.addTags) && isStringArray(value.removeTags)
  }
  return value.id === 'field_rename' && value.kind === 'field_rename' && isStringArray(value.proposedFields)
}

function isSentContribution(value: unknown): value is SentDeckContribution {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.kind === 'deck_tags' || value.kind === 'field_rename')
    && typeof value.preview === 'string'
    && typeof value.contributionId === 'string'
    && typeof value.sentAt === 'string'
}

function readContributions<T>(key: string, guard: (value: unknown) => value is T) {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter(guard) : []
  } catch {
    return []
  }
}

function writeContributions(key: string, value: PendingDeckContribution[] | SentDeckContribution[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

function ContributionsEmptyState({ children }: { children: string }) {
  return (
    <EmptyState className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-4 text-center">
      <Inbox className="size-6 text-muted" />
      <span className="text-sm text-muted">{children}</span>
    </EmptyState>
  )
}

interface PendingTableProps {
  contributions: PendingDeckContribution[]
  selectedKeys: Selection
  isSubmitting: boolean
  onSelectionChange: (selection: Selection) => void
  onSubmit: () => void
}

function PendingContributionsTable({ contributions, selectedKeys, isSubmitting, onSelectionChange, onSubmit }: PendingTableProps) {
  const t = useTranslations('contributions')
  const selectedCount = selectedKeys === 'all'
    ? contributions.length
    : contributions.filter((item) => selectedKeys.has(item.id)).length

  return (
    <>
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content
            aria-label={t('pending-tab', { count: contributions.length })}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
          >
            <Table.Header>
              <Table.Column className="pe-0">
                <Checkbox aria-label="Select all" slot="selection">
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </Table.Column>
              <Table.Column isRowHeader>{t('type')}</Table.Column>
              <Table.Column>{t('preview')}</Table.Column>
              <Table.Column>{t('saved-at')}</Table.Column>
            </Table.Header>
            <Table.Body
              items={contributions}
              renderEmptyState={() => <ContributionsEmptyState>{t('pending-empty')}</ContributionsEmptyState>}
            >
              {(item) => (
                <Table.Row id={item.id}>
                  <Table.Cell className="pe-0">
                    <Checkbox aria-label={`Select ${item.preview}`} slot="selection" variant="secondary">
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </Table.Cell>
                  <Table.Cell><Chip size="sm" variant="soft">{t(item.kind)}</Chip></Table.Cell>
                  <Table.Cell>{item.preview}</Table.Cell>
                  <Table.Cell>{new Date(item.savedAt).toLocaleString()}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      <div className="mt-4 flex justify-end">
        <AppButton
          variant="primary"
          isDisabled={selectedCount === 0 || isSubmitting}
          isPending={isSubmitting}
          onPress={onSubmit}
        >
          {t('submit-selected', { count: selectedCount })}
        </AppButton>
      </div>
    </>
  )
}

function SentContributionsTable({ contributions }: { contributions: SentDeckContribution[] }) {
  const t = useTranslations('contributions')

  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label={t('sent-tab', { count: contributions.length })}>
          <Table.Header>
            <Table.Column isRowHeader>{t('type')}</Table.Column>
            <Table.Column>{t('preview')}</Table.Column>
            <Table.Column>{t('contribution-id')}</Table.Column>
            <Table.Column>{t('sent-at')}</Table.Column>
          </Table.Header>
          <Table.Body
            items={contributions}
            renderEmptyState={() => <ContributionsEmptyState>{t('sent-empty')}</ContributionsEmptyState>}
          >
            {(item) => (
              <Table.Row id={item.id}>
                <Table.Cell><Chip size="sm" variant="soft">{t(item.kind)}</Chip></Table.Cell>
                <Table.Cell>{item.preview}</Table.Cell>
                <Table.Cell className="font-mono text-xs">{item.contributionId}</Table.Cell>
                <Table.Cell>{new Date(item.sentAt).toLocaleString()}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}

interface ContributionFormModalProps {
  deck: Deck
  kind: Exclude<ContributionForm, null>
  existing?: PendingDeckContribution
  onClose: () => void
  onSave: (contribution: PendingDeckContribution) => void
}

function ContributionFormModal({ deck, kind, existing, onClose, onSave }: ContributionFormModalProps) {
  const t = useTranslations()
  const [proposedFields, setProposedFields] = useState(
    existing?.kind === 'field_rename' ? existing.proposedFields : deck.fields,
  )
  const [addTagsInput, setAddTagsInput] = useState(existing?.kind === 'deck_tags' ? existing.addTags.join(', ') : '')
  const [removeTagsInput, setRemoveTagsInput] = useState(existing?.kind === 'deck_tags' ? existing.removeTags.join(', ') : '')
  const fieldsChanged = proposedFields.some((field, index) => field.trim() !== deck.fields[index])
  const fieldsValid = proposedFields.every((field) => field.trim().length > 0)
  const hasTagChanges = parseTags(addTagsInput).length > 0 || parseTags(removeTagsInput).length > 0

  const save = () => {
    if (kind === 'field_rename') {
      const fields = proposedFields.map((field) => field.trim())
      onSave({
        id: 'field_rename',
        kind: 'field_rename',
        preview: fields.join(' · '),
        proposedFields: fields,
        savedAt: new Date().toISOString(),
      })
      return
    }

    const addTags = parseTags(addTagsInput)
    const removeTags = parseTags(removeTagsInput)
    onSave({
      id: 'deck_tags',
      kind: 'deck_tags',
      preview: [...addTags.map((tag) => `+${tag}`), ...removeTags.map((tag) => `−${tag}`)].join(' · '),
      addTags,
      removeTags,
      savedAt: new Date().toISOString(),
    })
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {kind === 'field_rename' ? t('contributions.field-rename-title') : t('contributions.deck-tags-title')}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            {kind === 'field_rename'
              ? deck.fields.map((field, index) => (
                <div className="grid gap-2 sm:grid-cols-2" key={`${field}-${index}`}>
                  <AppInput
                    isReadOnly
                    label={t('contributions.current-field', { number: index + 1 })}
                    value={field}
                    inputProps={{ variant: 'secondary' }}
                  />
                  <AppInput
                    label={t('contributions.suggested-field', { number: index + 1 })}
                    value={proposedFields[index] ?? ''}
                    onChange={(value) => setProposedFields((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
                    inputProps={{ variant: 'secondary' }}
                  />
                </div>
              ))
              : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AppInput
                    label={t('contributions.add-tags')}
                    description={t('contributions.tags-description')}
                    value={addTagsInput}
                    onChange={setAddTagsInput}
                    inputProps={{ variant: 'secondary' }}
                  />
                  <AppInput
                    label={t('contributions.remove-tags')}
                    description={t('contributions.tags-description')}
                    value={removeTagsInput}
                    onChange={setRemoveTagsInput}
                    inputProps={{ variant: 'secondary' }}
                  />
                </div>
              )}
          </Modal.Body>
          <Modal.Footer>
            <AppButton isIconOnly aria-label={t('common.cancel')} variant="primary" onPress={onClose}>
              <X className="size-4" />
            </AppButton>
            <AppButton
              isIconOnly
              aria-label={t('common.save')}
              variant="primary"
              isDisabled={kind === 'field_rename' ? !fieldsChanged || !fieldsValid : !hasTagChanges}
              onPress={save}
            >
              <Check className="size-4" />
            </AppButton>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

export default function DeckContributionsPanel({ deck }: DeckContributionsPanelProps) {
  const t = useTranslations('contributions')
  const pendingStorageKey = `retentio_pending_contribs_v2:${deck.id}`
  const sentStorageKey = `retentio_sent_contribs_v1:${deck.id}`
  const [selectedTab, setSelectedTab] = useState('pending')
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set())
  const [pendingContributions, setPendingContributions] = useState<PendingDeckContribution[]>([])
  const [sentContributions, setSentContributions] = useState<SentDeckContribution[]>([])
  const [form, setForm] = useState<ContributionForm>(null)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPendingContributions(readContributions(pendingStorageKey, isPendingContribution))
      setSentContributions(readContributions(sentStorageKey, isSentContribution))
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingStorageKey, sentStorageKey])

  const saveContribution = (contribution: PendingDeckContribution) => {
    const next = [...pendingContributions.filter((item) => item.id !== contribution.id), contribution]
    setPendingContributions(next)
    writeContributions(pendingStorageKey, next)
    setForm(null)
    setSelectedTab('pending')
  }

  const submitSelected = () => {
    const selected = selectedKeys === 'all'
      ? pendingContributions
      : pendingContributions.filter((item) => selectedKeys.has(item.id))
    if (selected.length === 0) return

    startTransition(async () => {
      const result = await submitDeckContributionsBatchAction({ importDeckId: deck.id, contributions: selected }, null, new FormData())
      if (!result?.success || !result.data) {
        showFailToast(result?.error ?? t('submit-failed'))
        return
      }

      const batchResult = result.data
      const submittedIds = new Set(batchResult.submitted.map((item) => item.localId))
      const remaining = pendingContributions.filter((item) => !submittedIds.has(item.id))
      const sentAt = new Date().toISOString()
      const newlySent: SentDeckContribution[] = batchResult.submitted.map((item, index) => ({
        id: `${item.kind}:deck:${Date.now() + index}`,
        kind: item.kind,
        preview: selected.find((contribution) => contribution.id === item.localId)?.preview ?? '',
        contributionId: item.contributionId,
        sentAt,
      }))
      const nextSent = [...sentContributions, ...newlySent]
      setPendingContributions(remaining)
      setSentContributions(nextSent)
      setSelectedKeys(new Set())
      writeContributions(pendingStorageKey, remaining)
      writeContributions(sentStorageKey, nextSent)

      if (batchResult.submitted.length > 0) {
        setSelectedTab('sent')
        showSuccessToast(t('batch-submit-success', { count: batchResult.submitted.length }))
      }
      if (batchResult.failed.length > 0) showFailToast(t('batch-submit-failed', { count: batchResult.failed.length }))
    })
  }

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys)
  }

  return (
    <>
      <Card className="border-border/50" variant="default">
        <Card.Header className="flex-row items-start justify-between gap-4">
          <div>
            <Card.Title>{t('title')}</Card.Title>
            <Card.Description className="mt-1">{t('description')}</Card.Description>
          </div>
          <div className="flex shrink-0 gap-2">
            <AppButton
              isIconOnly
              aria-label={t('field-rename-title')}
              variant="primary"
              onPress={() => setForm('field_rename')}
            >
              <PencilLine className="size-4" />
            </AppButton>
            <AppButton
              isIconOnly
              aria-label={t('deck-tags-title')}
              variant="primary"
              onPress={() => setForm('deck_tags')}
            >
              <Tags className="size-4" />
            </AppButton>
          </div>
        </Card.Header>
        <Card.Content className="pt-0">
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(String(key))} variant="primary">
            <Tabs.ListContainer>
              <Tabs.List aria-label={t('title')}>
                <Tabs.Tab id="pending" onMouseDown={(event) => event.preventDefault()}>
                  {t('pending-tab', { count: pendingContributions.length })}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="sent" onMouseDown={(event) => event.preventDefault()}>
                  {t('sent-tab', { count: sentContributions.length })}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="pending">
              <PendingContributionsTable
                contributions={pendingContributions}
                selectedKeys={selectedKeys}
                isSubmitting={isSubmitting}
                onSelectionChange={handleSelectionChange}
                onSubmit={submitSelected}
              />
            </Tabs.Panel>
            <Tabs.Panel id="sent">
              <SentContributionsTable contributions={sentContributions} />
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>

      {form
        ? (
          <ContributionFormModal
            key={`${form}-${pendingContributions.find((item) => item.kind === form)?.savedAt ?? 'new'}`}
            deck={deck}
            kind={form}
            existing={pendingContributions.find((item) => item.kind === form)}
            onClose={() => setForm(null)}
            onSave={saveContribution}
          />
        )
        : null}
    </>
  )
}
