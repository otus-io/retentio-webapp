'use client'

import type { Selection } from '@heroui/react'
import { Card, Checkbox, Chip, EmptyState, Modal, Table, Tabs } from '@heroui/react'
import { Check, FileText, Inbox, PencilLine, Tags, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import AppTextarea from '@/components/app/AppTextarea'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import { EMAIL_NOT_VERIFIED_CODE } from '@/modules/auth/auth.schema'
import { sendToAuthor } from '@/modules/contributions/auto-send'
import { submitDeckContributionsBatchAction } from '@/modules/contributions/contributions.action'
import type { PendingDeckContribution, SentDeckContribution } from '@/modules/contributions/contributions.schema'
import type { Deck } from '@/modules/decks/decks.schema'
import {
  isPendingContribution,
  isSentContribution,
  pendingStorageKey,
  readContributions,
  sentStorageKey,
  writeContributions,
} from '@/modules/contributions/pending-contributions'

interface DeckContributionsPanelProps { deck: Deck }
export type ContributionForm = 'field_rename' | 'deck_tags' | 'description_edit' | null

/** The backend caps a deck description at 500 bytes of UTF-8, not 500 characters. */
const MAX_DESCRIPTION_BYTES = 500

const FORM_TITLES = {
  field_rename: 'contributions.field-rename-title',
  deck_tags: 'contributions.deck-tags-title',
  description_edit: 'contributions.description-title',
} as const

function parseTags(value: string) {
  return [...new Set(value.split(/[,，\n]/).map((tag) => tag.trim()).filter(Boolean))]
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

export function ContributionFormModal({ deck, kind, existing, onClose, onSave }: ContributionFormModalProps) {
  const t = useTranslations()
  const [proposedFields, setProposedFields] = useState(
    existing?.kind === 'field_rename' ? existing.proposedFields : deck.fields,
  )
  const [addTagsInput, setAddTagsInput] = useState(existing?.kind === 'deck_tags' ? existing.addTags.join(', ') : '')
  const [removeTagsInput, setRemoveTagsInput] = useState(existing?.kind === 'deck_tags' ? existing.removeTags.join(', ') : '')
  const currentDescription = deck.description ?? ''
  const [proposedDescription, setProposedDescription] = useState(
    existing?.kind === 'description_edit' ? existing.proposedDescription : currentDescription,
  )
  const [message, setMessage] = useState(existing?.kind === kind ? existing.message ?? '' : '')
  const fieldsChanged = proposedFields.some((field, index) => field.trim() !== deck.fields[index])
  const fieldsValid = proposedFields.every((field) => field.trim().length > 0)
  const hasTagChanges = parseTags(addTagsInput).length > 0 || parseTags(removeTagsInput).length > 0
  const description = proposedDescription.trim()
  const descriptionValid = description.length > 0
    && new TextEncoder().encode(description).length <= MAX_DESCRIPTION_BYTES
    && description !== currentDescription.trim()
  const canSave = kind === 'field_rename'
    ? fieldsChanged && fieldsValid
    : kind === 'description_edit' ? descriptionValid : hasTagChanges
  const note = message.trim() ? { message: message.trim() } : {}

  const save = () => {
    if (kind === 'field_rename') {
      const fields = proposedFields.map((field) => field.trim())
      onSave({
        id: 'field_rename',
        kind: 'field_rename',
        preview: fields.join(' · '),
        proposedFields: fields,
        ...note,
        savedAt: new Date().toISOString(),
      })
      return
    }

    if (kind === 'description_edit') {
      onSave({
        id: 'description_edit',
        kind: 'description_edit',
        // Cut by code point so an emoji is never split in half.
        preview: Array.from(description).length > 80 ? `${Array.from(description).slice(0, 79).join('')}…` : description,
        proposedDescription: description,
        ...note,
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
      ...note,
      savedAt: new Date().toISOString(),
    })
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(FORM_TITLES[kind])}</Modal.Heading>
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
              : kind === 'description_edit'
                ? (
                  <>
                    <AppTextarea
                      isReadOnly
                      label={t('contributions.current-description')}
                      value={currentDescription || '—'}
                      inputProps={{ variant: 'secondary' }}
                    />
                    <AppTextarea
                      label={t('contributions.suggested-description')}
                      value={proposedDescription}
                      onChange={setProposedDescription}
                      inputProps={{ variant: 'secondary' }}
                    />
                  </>
                )
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
            <AppInput
              label={t('contributions.message')}
              placeholder={t('contributions.message-placeholder')}
              value={message}
              onChange={setMessage}
              maxLength={2000}
              inputProps={{ variant: 'secondary' }}
            />
          </Modal.Body>
          <Modal.Footer>
            <AppButton isIconOnly aria-label={t('common.cancel')} variant="primary" onPress={onClose}>
              <X className="size-4" />
            </AppButton>
            <AppButton
              isIconOnly
              aria-label={t('common.save')}
              variant="primary"
              isDisabled={!canSave}
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
  const tAuth = useTranslations('auth')
  const tSend = useTranslations('auto-send')
  const pendingKey = pendingStorageKey(deck.id)
  const sentKey = sentStorageKey(deck.id)
  const [selectedTab, setSelectedTab] = useState('pending')
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set())
  const [pendingContributions, setPendingContributions] = useState<PendingDeckContribution[]>([])
  const [sentContributions, setSentContributions] = useState<SentDeckContribution[]>([])
  const [form, setForm] = useState<ContributionForm>(null)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPendingContributions(readContributions(pendingKey, isPendingContribution))
      setSentContributions(readContributions(sentKey, isSentContribution))
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingKey, sentKey])

  const saveContribution = (contribution: PendingDeckContribution) => {
    setForm(null)
    startTransition(async () => {
      // Sent to the author right away, as on mobile; it stays pending only if sending fails.
      const { unsent } = await sendToAuthor(deck.id, [contribution])
      setPendingContributions(readContributions(pendingKey, isPendingContribution))
      setSentContributions(readContributions(sentKey, isSentContribution))
      setSelectedTab(unsent > 0 ? 'pending' : 'sent')
      if (unsent > 0) showFailToast(tSend('unsent'))
      else showSuccessToast(tSend('sent'))
    })
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
      writeContributions(pendingKey, remaining)
      writeContributions(sentKey, nextSent)

      if (batchResult.submitted.length > 0) {
        setSelectedTab('sent')
        showSuccessToast(t('batch-submit-success', { count: batchResult.submitted.length }))
      }
      const otherFailures = batchResult.failed.filter((item) => item.code !== EMAIL_NOT_VERIFIED_CODE)
      if (otherFailures.length < batchResult.failed.length) showFailToast(tAuth('emailNotVerifiedError'))
      if (otherFailures.length > 0) showFailToast(t('batch-submit-failed', { count: otherFailures.length }))
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
              isDisabled={isSubmitting}
              onPress={() => setForm('field_rename')}
            >
              <PencilLine className="size-4" />
            </AppButton>
            <AppButton
              isIconOnly
              aria-label={t('deck-tags-title')}
              variant="primary"
              isDisabled={isSubmitting}
              onPress={() => setForm('deck_tags')}
            >
              <Tags className="size-4" />
            </AppButton>
            <AppButton
              isIconOnly
              aria-label={t('description-title')}
              variant="primary"
              isDisabled={isSubmitting}
              onPress={() => setForm('description_edit')}
            >
              <FileText className="size-4" />
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
