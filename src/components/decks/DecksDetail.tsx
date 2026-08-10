'use client'
import type { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import DecksIconLabel from '@/components/decks/DecksLabel'
import {
  ListTodo,
  History,
  Layers,
  Inbox,
  CheckCircle2,
  EyeOff,
  Sparkles,
  Clock,
  ListIcon,
  Tag,
} from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import DecksAction from '@/components/decks/DecksAction'
import LayoutPage from '@/components/layout/LayoutPage'
import TagItem from '@/components/tags/TagItem'
import DeckPublishPanel from '@/components/decks/DeckPublishPanel'
import DeckImportUpdatesPanel from '@/components/decks/DeckImportUpdatesPanel'
import type { DeckImportUpdatesResponseDTO } from '@/modules/deck-sharing/deck-sharing.schema'

interface DecksDetailProps {
  deck: Deck
  updates: DeckImportUpdatesResponseDTO['data'] | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

export default function DecksDetail({ deck, updates }: DecksDetailProps) {
  const t = useTranslations()

  const progressPct = deck.stats.cards_count > 0
    ? (deck.stats.reviewed_cards / deck.stats.cards_count) * 100
    : 0

  const format = useFormatter()

        const last_reviewed_at = deck.stats.last_reviewed_at
          ? format.dateTime(new Date(deck.stats.last_reviewed_at), { dateStyle: 'medium', timeStyle: 'short' })
          : t('term.never')
    timeStyle: 'short',
  })

  const tags = deck.tags ?? []

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
      ]}
    >
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Card variant="default" className=" overflow-hidden">
          <Card.Header>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Card.Title className="text-xl font-bold tracking-tight text-foreground mb-2">
                  {deck.name}
                </Card.Title>
                {deck.fields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {deck.fields.map((e, index) => (
                      <Chip className="font-medium bg-secondary/60" key={index} size="sm">
                        {e}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
              <DecksAction deck={deck} actions={['facts']} />
            </div>
          </Card.Header>

          <Card.Content className="pt-0 space-y-4">
            {/* Progress block */}
            <div>
              <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground tabular-nums">
                <span>{progressPct.toFixed(1)}%</span>
                <span>{deck.stats.reviewed_cards} / {deck.stats.cards_count}</span>
              </div>
            </div>



            {/* Stats grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-2 md:grid-cols-2"
            >

              {/* Tags */}
              {tags.length > 0 && (
                <DecksIconLabel icon={Tag} color="amber" className="md:col-span-2 items-start!">
                  <span className="text-muted-foreground inline-block h-7 mr-2 leading-7">{t('term.tags')}:</span>
                  <div className="inline-flex flex-wrap gap-2 ">
                    {tags.map((e) => (
                      <TagItem tag={e} key={e.id} editable ={false} />
                    ))}
                  </div>
                </DecksIconLabel>
              )}

              <DecksIconLabel icon={History} color="amber">
                <span className="text-muted-foreground">{t('term.rate')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.rate}</span>
              </DecksIconLabel>

              <DecksIconLabel icon={ListTodo} color="rose">
                <span className="text-muted-foreground">{t('term.due')}:</span>
                <span className="font-medium text-foreground ml-1">{deck.stats.due_cards}</span>
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

              <DecksIconLabel icon={Clock} color="slate" className="md:col-span-2">
                <span className="text-muted-foreground">{t('term.last-review')}:</span>
                <span className="font-medium text-foreground ml-1">{last_reviewed_at}</span>
              </DecksIconLabel>
            </motion.div>
          </Card.Content>
        </Card>
        {!deck.source_deck_id && <DeckPublishPanel deck={deck} />}
        {deck.source_deck_id && updates && (
          <DeckImportUpdatesPanel deckId={deck.id} updates={updates} />
        )}
      </motion.div>
    </LayoutPage>
  )
}
