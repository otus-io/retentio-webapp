'use client'

import { Card, Chip, EmptyState, Table, Tabs } from '@heroui/react'
import { Inbox } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Key } from 'react'
import { useState, useTransition } from 'react'
import AppButton from '@/components/app/AppButton'
import { showFailToast, showSuccessToast } from '@/lib/ui'
import {
  acceptContributionAction,
  updateContributionStatusAction,
} from '@/modules/contributions/contributions.action'
import type {
  Contribution,
  ContributionStatus,
  ContributionType,
} from '@/modules/contributions/contributions.schema'

export type ContributionInboxTab = 'all' | ContributionStatus

interface DeckAuthorContributionsPanelProps {
  deckId: string
  contributions: Contribution[]
  selectedTab: ContributionInboxTab
  total: number
  loadFailed: boolean
}

const tabs: ContributionInboxTab[] = ['all', 'open', 'accepted', 'resolved', 'dismissed']

function contributionTypeKey(type: ContributionType) {
  return `types.${type}` as const
}

function contributionStatusKey(status: ContributionStatus) {
  return `statuses.${status}` as const
}

function ContributionInboxEmptyState({ message }: { message: string }) {
  return (
    <EmptyState className="flex min-h-40 w-full flex-col items-center justify-center gap-4 text-center">
      <Inbox className="size-6 text-muted" />
      <span className="text-sm text-muted">{message}</span>
    </EmptyState>
  )
}

export default function DeckAuthorContributionsPanel({
  deckId,
  contributions,
  selectedTab,
  total,
  loadFailed,
}: DeckAuthorContributionsPanelProps) {
  const t = useTranslations('author-contributions')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingContributionId, setPendingContributionId] = useState<string | null>(null)
  const [isNavigating, startNavigation] = useTransition()
  const [isMutating, startMutation] = useTransition()

  const selectTab = (key: Key) => {
    const nextTab = String(key) as ContributionInboxTab
    if (nextTab === selectedTab) return

    const params = new URLSearchParams(searchParams.toString())
    if (nextTab === 'open') params.delete('contributionStatus')
    else params.set('contributionStatus', nextTab)

    startNavigation(() => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const mutateContribution = (
    contributionId: string,
    operation: 'accept' | 'resolved' | 'dismissed',
  ) => {
    setPendingContributionId(contributionId)
    startMutation(async () => {
      const result = operation === 'accept'
        ? await acceptContributionAction({ sourceDeckId: deckId, contributionId }, null, new FormData())
        : await updateContributionStatusAction({
          sourceDeckId: deckId,
          contributionId,
          data: { status: operation },
        }, null, new FormData())

      setPendingContributionId(null)
      if (!result?.success) {
        showFailToast(result?.error ?? t('operation-failed'))
        return
      }

      showSuccessToast(t(`operation-success.${operation}`))
      router.refresh()
    })
  }

  return (
    <Card className="border-border/50" variant="default">
      <Card.Header>
        <Card.Title>{t('title')}</Card.Title>
        <Card.Description className="mt-1">
          {t('description', { count: contributions.length, total })}
        </Card.Description>
      </Card.Header>
      <Card.Content className="pt-0">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={selectTab}
          variant="primary"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label={t('title')}>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab} id={tab} onMouseDown={(event) => event.preventDefault()}>
                  {t(`tabs.${tab}`)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          {tabs.map((tab) => (
            <Tabs.Panel key={tab} id={tab}>
              <div className={isNavigating ? 'opacity-50' : undefined}>
                <Table variant="secondary">
                  <Table.ScrollContainer>
                    <Table.Content aria-label={t('table-label')}>
                      <Table.Header>
                        <Table.Column isRowHeader>{t('id')}</Table.Column>
                        <Table.Column>{t('status')}</Table.Column>
                        <Table.Column>{t('source')}</Table.Column>
                        <Table.Column>{t('type')}</Table.Column>
                        <Table.Column>{t('actions')}</Table.Column>
                      </Table.Header>
                      <Table.Body
                        items={contributions}
                        renderEmptyState={() => (
                          <ContributionInboxEmptyState
                            message={loadFailed ? t('load-failed') : t('empty')}
                          />
                        )}
                      >
                        {(item) => {
                          const isPending = isMutating && pendingContributionId === item.id
                          const canAccept = item.status === 'open' && item.type !== 'report'
                          const canClose = item.status === 'open'

                          return (
                            <Table.Row id={item.id}>
                              <Table.Cell className="font-mono text-xs">{item.id}</Table.Cell>
                              <Table.Cell>
                                <Chip size="sm" variant={item.status === 'open' ? 'primary' : 'soft'}>
                                  {t(contributionStatusKey(item.status))}
                                </Chip>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-medium">{item.reporter}</span>
                                <span className="ml-1 text-xs text-muted">· v{item.source_version}</span>
                              </Table.Cell>
                              <Table.Cell>{t(contributionTypeKey(item.type))}</Table.Cell>
                              <Table.Cell>
                                {canAccept || canClose
                                  ? (
                                    <div className="flex flex-wrap gap-2">
                                      {canAccept
                                        ? (
                                          <AppButton
                                            size="sm"
                                            variant="primary"
                                            isDisabled={isMutating}
                                            isPending={isPending}
                                            onPress={() => mutateContribution(item.id, 'accept')}
                                          >
                                            {t('accept-proposal')}
                                          </AppButton>
                                        )
                                        : null}
                                      {canClose
                                        ? (
                                          <>
                                            <AppButton
                                              size="sm"
                                              variant="secondary"
                                              isDisabled={isMutating}
                                              isPending={isPending}
                                              onPress={() => mutateContribution(item.id, 'resolved')}
                                            >
                                              {t('mark-resolved')}
                                            </AppButton>
                                            <AppButton
                                              size="sm"
                                              variant="danger"
                                              isDisabled={isMutating}
                                              isPending={isPending}
                                              onPress={() => mutateContribution(item.id, 'dismissed')}
                                            >
                                              {t('dismiss')}
                                            </AppButton>
                                          </>
                                        )
                                        : null}
                                    </div>
                                  )
                                  : <span className="text-muted">—</span>}
                              </Table.Cell>
                            </Table.Row>
                          )
                        }}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </div>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Card.Content>
    </Card>
  )
}
