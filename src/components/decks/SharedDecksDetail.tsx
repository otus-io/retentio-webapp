'use client'
import AppLink from '@/components/app/AppLink'
import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'
import { Card } from '@heroui/react'
import { User, Layers, CalendarDays } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { useFormatter } from 'next-intl'
import LayoutPage from '@/components/layout/LayoutPage'
import AppButton from '@/components/app/AppButton'
import { useUserContext } from '@/context/UserContext'

interface SharedDecksDetailProps {
  deck: DeckCatalogItem
}

export default function SharedDecksDetail({
  deck,
}: SharedDecksDetailProps) {
  const t = useTranslations()
  const { accessAction } = useUserContext()
  const format = useFormatter()

  const publishedAt = useMemo(
    () => format.dateTime(new Date(deck.published_at), { dateStyle: 'medium' }),
    [deck.published_at, format],
  )
  const handleImport = useCallback(() => {
    accessAction(() => {
      console.log('导入')
    })
  }, [accessAction])

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
            <AppButton onClick={handleImport} className="ml-auto">{t('deck-sharing.import')}</AppButton>
          </div>
        </Card.Content>
      </Card>
    </LayoutPage>
  )
}
