'use client'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip } from '@heroui/react'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import DecksIconLabel from '@/components/decks/DecksLabel'
import {
  ListTodo,
  ChartPie,
  History,
  Layers,
  Brain,
  Inbox,
  CheckCircle2,
  EyeOff,
  Sparkles,
  Clock,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'
import DecksAction from '@/components/decks/DecksAction'

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
    <div className="mx-auto grid w-full max-w-content items-start gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <AppBreadcrumbs
        items={[
          { href: '/decks', title: t('nav.decks') },
          { href: `/decks/${deck.id}`, title: deck.name },
        ]}
      />
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
                <DecksAction deck={deck} />
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
                <span className="text-muted-foreground">{t('decks.rate')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.rate}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ListTodo} color="rose">
                <span className="text-muted-foreground">{t('decks.due')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.due_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ChartPie} color="emerald">
                <span className="text-muted-foreground">{t('decks.progress')}:</span>
                <span className="font-medium text-foreground ml-1">{progress}%</span>
              </DecksIconLabel>


              <DecksIconLabel icon={Brain} color="violet">
                <span className="text-muted-foreground">{t('decks.facts')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.facts_count}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Layers} color="cyan">
                <span className="text-muted-foreground">{t('decks.cards')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.cards_count}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Inbox} color="slate">
                <span className="text-muted-foreground">{t('decks.unseen')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.unseen_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={CheckCircle2} color="emerald">
                <span className="text-muted-foreground">{t('decks.reviewed')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.reviewed_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={EyeOff} color="orange">
                <span className="text-muted-foreground">{t('decks.hidden')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.hidden_cards}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Sparkles} color="yellow">
                <span className="text-muted-foreground">{t('decks.new-today')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.new_cards_today}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={Clock} color="slate">
                <span className="text-muted-foreground">{t('decks.last-review')}:</span>
                <span className="font-medium text-foreground ml-1">{last_reviewed_at}</span>
              </DecksIconLabel>
            </motion.div>
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  )
}
