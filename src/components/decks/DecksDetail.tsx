'use client'
import type { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip } from '@heroui/react'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import DecksIconLabel from '@/components/decks/DecksLabel'
import {
  ListTodo,
  ChartPie,
  History,
  Layers,
  Inbox,
  CheckCircle2,
  EyeOff,
  Sparkles,
  Clock,
  ListIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import DecksAction from '@/components/decks/DecksAction'
import LayoutPage from '@/components/layout/LayoutPage'

interface DecksDetailProps {
  deck: Deck
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

export default function DecksDetail({ deck }: DecksDetailProps) {
  const t = useTranslations()

  const progress =
    deck.stats.cards_count > 0
      ? ((deck.stats.reviewed_cards / deck.stats.cards_count) * 100).toFixed(2)
      : '0.00'

  const last_reviewed_at = useMemo(() => {
    if (deck.stats.last_reviewed_at) {
      const date = new Date(deck.stats.last_reviewed_at * 1000)
      return date.toLocaleString()
    }
    return 'never'
  }, [deck.stats.last_reviewed_at])



  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
      ]}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Card variant="default" className="hover:shadow-md transition-all duration-300 border-border/50 min-h-0">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-lg flex-wrap w-full flex  items-center font-semibold tracking-tight text-foreground hover:text-primary transition-colors gap-2 md:gap-4">
                <div className="w-full md:w-auto">{deck.name}</div>
                <div className="flex-wrap items-center gap-1.5 inline-flex">
                  {deck.fields.map((e, index) => (
                    <Chip className="font-medium bg-secondary/50" key={index} size="sm">
                      {e}
                    </Chip>
                  ))}
                </div>
                <div className="ml-auto">
                  <DecksAction deck={deck} />
                </div>
              </Card.Title>
            </div>
          </Card.Header>

          <Card.Content>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-2 md:grid-cols-2"
            >

              <DecksIconLabel icon={History} color="amber">
                <span className="text-muted-foreground">{t('term.rate')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.rate}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ListTodo} color="rose">
                <span className="text-muted-foreground">{t('term.due')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.due_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ChartPie} color="emerald">
                <span className="text-muted-foreground">{t('term.progress')}:</span>
                <span className="font-medium text-foreground ml-1">{progress}%</span>
              </DecksIconLabel>


              <DecksIconLabel icon={ListIcon} color="violet">
                <span className="text-muted-foreground">{t('term.facts')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.facts_count}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Layers} color="cyan">
                <span className="text-muted-foreground">{t('term.cards')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.cards_count}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Inbox} color="slate">
                <span className="text-muted-foreground">{t('term.unseen')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.unseen_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={CheckCircle2} color="emerald">
                <span className="text-muted-foreground">{t('term.reviewed')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.reviewed_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={EyeOff} color="orange">
                <span className="text-muted-foreground">{t('term.hidden')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.hidden_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Sparkles} color="yellow">
                <span className="text-muted-foreground">{t('term.new-today')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.new_cards_today}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Clock} color="slate">
                <span className="text-muted-foreground">{t('term.last-review')}:</span>
                <span className="font-medium text-foreground ml-1">{last_reviewed_at}</span>
              </DecksIconLabel>
            </motion.div>
          </Card.Content>
        </Card>
      </motion.div>
    </LayoutPage>
  )
}
