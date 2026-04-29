'use client'
import AppLink from '@/components/app/AppLink'
import { Deck } from '@/modules/decks/decks.schema'
import { Card } from '@heroui/react'
import { ChartPie, ListTodo } from 'lucide-react'
import DecksIconLabel from '@/components/decks/DecksLabel'
import HighlightedText from '@/components/common/HighlightedText'
import { useTranslations } from 'next-intl'
import DecksAction from '@/components/decks/DecksAction'

interface DecksCardProps {
  deck: Deck,
  highlight?: string,
}

export default function DecksCard({
  deck,
  highlight = '',
}: DecksCardProps) {

  const t = useTranslations()
  const progress = deck.stats.cards_count > 0
    ? ((deck.stats.reviewed_cards / deck.stats.cards_count) * 100).toFixed(2)
    : '0.00'

  return (
    <>
      <Card variant="default" className="hover:shadow-sm transition-all duration-200">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>
              <AppLink
                href={`/decks/${deck.id}`}
                className="text-lg font-semibold tracking-tight text-foreground hover:text-accent hover:underline transition-colors"
              >
                <HighlightedText
                  text={deck.name}
                  highlight={highlight}
                />
              </AppLink>
            </Card.Title>
            <DecksAction deck={deck} />
          </div>
        </Card.Header>

        {/* 内容区域 */}
        <Card.Content>
          <div className="flex items-center gap-2">
            <DecksIconLabel icon={ListTodo} color={'orange'}>
              {t('decks.due')}: <span className="font-medium ml-0.5">{deck.stats.due_cards}</span>
            </DecksIconLabel>
            <DecksIconLabel icon={ChartPie} color={'emerald'}>
              {t('decks.progress')}: <span className="font-medium  ml-0.5">{progress}%</span>
            </DecksIconLabel>
          </div>
        </Card.Content>
      </Card>
    </>
  )
}


