'use client'
import AppLink from '@/components/app/AppLink'
import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'
import { Card } from '@heroui/react'
import { User, Layers, CalendarDays } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useCallback, useEffect, useMemo } from 'react'
import type { FormEventHandler } from 'react'
import { useFormatter } from 'next-intl'
import LayoutPage from '@/components/layout/LayoutPage'
import AppButton from '@/components/app/AppButton'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import { useUserContext } from '@/context/UserContext'
import { showFailToast } from '@/lib/ui'
import { importDeckAction } from '@/modules/deck-sharing/deck-sharing.action'

interface SharedDecksDetailProps {
  deck: DeckCatalogItem
  importedDeckId: string | null
  ownedDeckId: string | null
}

export default function SharedDecksDetail({
  deck,
  importedDeckId,
  ownedDeckId,
}: SharedDecksDetailProps) {
  const t = useTranslations()
  const { isLogin, accessAction } = useUserContext()
  const format = useFormatter()
  const [state, action, isPending] = useActionState(
    importDeckAction.bind(null, deck.id),
    null,
  )

  const publishedAt = useMemo(
    () => format.dateTime(new Date(deck.published_at), { dateStyle: 'medium' }),
    [deck.published_at, format],
  )

  const handleImport = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      if (isLogin) return

      event.preventDefault()
      accessAction(() => {})
    },
    [isLogin, accessAction],
  )
  useEffect(() => {
    if (state?.error) showFailToast(state.error)
  }, [state])

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: '/decks/shared', title: t('term.deck-sharing') },
        { href: `/decks/shared/${deck.id}`, title: deck.name },
      ]}
    >
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between gap-2">
            <Card.Title className="flex-1 min-w-0">
              <AppLink
                onClick={(e) => { e.stopPropagation() }}
                href={`/decks/shared/${deck.id}`}
                className="text-base font-semibold tracking-tight text-foreground hover:text-accent transition-colors line-clamp-1"
              >
                {deck.name}
              </AppLink>
            </Card.Title>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Layers className="size-3 text-accent" />
              <span className="font-semibold text-foreground tabular-nums">{deck.fact_count}</span>
              <span>{t('term.facts')}</span>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="pt-0 space-y-2.5">
          {deck.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {deck.description}
            </p>
          )}

          <div className="flex items-center  gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="size-3 shrink-0" />
              <span className="shrink-0">{t('deck-sharing.creator')}:</span>
              <span className="font-medium text-foreground truncate">{deck.owner}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CalendarDays className="size-3 shrink-0" />
              <span>{publishedAt}</span>
            </div>
            {ownedDeckId
              ? (
                <AppButtonLink href={`/decks/${ownedDeckId}`} className="ml-auto">
                  {t('deck-sharing.view-my-deck')}
                </AppButtonLink>
              )
              : (importedDeckId
                ? (
                  <AppButtonLink href={`/decks/${importedDeckId}`} className="ml-auto">
                    {t('deck-sharing.go-study')}
                  </AppButtonLink>
                )
                : (
                  <form action={action} onSubmit={handleImport} className="ml-auto">
                    <AppButton type="submit" isPending={isPending}>
                      {t('deck-sharing.import')}
                    </AppButton>
                  </form>
                ))}
          </div>
        </Card.Content>
      </Card>
    </LayoutPage>
  )
}
