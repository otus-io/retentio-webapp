'use client'

import { useState, useCallback } from 'react'
import { Card, Chip, Separator, useOverlayState, Modal } from '@heroui/react'
import { useTranslations } from 'next-intl'
import {
  ChevronRight,
  Download,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  SquareStack,
  Trash2,
  Upload,
} from 'lucide-react'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import AppTextarea from '@/components/app/AppTextarea'

interface Deck {
  id: string
  name: string
  description: string
  cardCount: number
}

interface CardItem {
  id: string
  front: string
  back: string
  facts: string[]
}

const MOCK_DECKS: Deck[] = [
  { id: '1', name: 'Japanese N5', description: 'JLPT N5 level vocabulary', cardCount: 120 },
  { id: '2', name: 'Spanish Verbs', description: 'Common Spanish verb conjugations', cardCount: 85 },
  { id: '3', name: 'Medical Terms', description: 'Medical terminology for exam prep', cardCount: 200 },
]

const MOCK_CARDS: Record<string, CardItem[]> = {
  '1': [
    { id: 'c1', front: '食べる', back: 'to eat (taberu)', facts: ['Group 2 verb', 'Ichidan verb'] },
    { id: 'c2', front: '飲む', back: 'to drink (nomu)', facts: ['Group 1 verb', 'Godan verb'] },
    { id: 'c3', front: '見る', back: 'to see (miru)', facts: ['Group 2 verb'] },
  ],
  '2': [
    { id: 'c4', front: 'hablar', back: 'to speak', facts: ['Regular -ar verb'] },
    { id: 'c5', front: 'comer', back: 'to eat', facts: ['Regular -er verb'] },
  ],
  '3': [
    { id: 'c6', front: 'Tachycardia', back: 'Abnormally rapid heart rate', facts: ['> 100 bpm at rest'] },
  ],
}

export default function Library() {
  const t = useTranslations('library')

  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null)
  const createDialog = useOverlayState()

  const currentCards = selectedDeck ? MOCK_CARDS[selectedDeck.id] || [] : []

  const handleSelectDeck = useCallback((deck: Deck) => {
    setSelectedDeck(deck)
    setSelectedCard(null)
  }, [])

  return (
    <div className="py-6 md:py-10 max-w-content w-full px-4 md:px-6 mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
        <div className="flex gap-2">
          <AppButton variant="secondary" size="sm" icon={<Upload className="size-4" />}>
            {t('import')}
          </AppButton>
          <AppButton variant="secondary" size="sm" icon={<Download className="size-4" />}>
            {t('export')}
          </AppButton>
        </div>
      </div>

      {/* Breadcrumb - mobile only */}
      <div className="flex md:hidden items-center gap-1.5 text-sm text-muted mb-4 min-h-8">
        <button
          type="button"
          className="hover:text-foreground transition-colors cursor-pointer font-medium"
          onClick={() => { setSelectedDeck(null); setSelectedCard(null) }}
        >
          {t('decks')}
        </button>
        {selectedDeck && (
          <>
            <ChevronRight className="size-3.5" />
            <button
              type="button"
              className="hover:text-foreground transition-colors cursor-pointer font-medium"
              onClick={() => setSelectedCard(null)}
            >
              {selectedDeck.name}
            </button>
          </>
        )}
        {selectedCard && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">{selectedCard.front}</span>
          </>
        )}
      </div>

      {/* Content area - 3 columns on md+, single column drill-down on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Decks column */}
        <div className={`${selectedDeck || selectedCard ? 'hidden md:block' : ''}`}>
          <Card className="md:min-h-125">
            <Card.Content>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-indigo-500" />
                  <span className="font-semibold text-sm">{t('decks')}</span>
                </div>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-default/40 transition-colors text-accent cursor-pointer"
                  onClick={createDialog.open}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="space-y-1">
                {MOCK_DECKS.length === 0 && (
                  <p className="text-sm text-muted py-4 text-center">{t('emptyDecks')}</p>
                )}
                {MOCK_DECKS.map((deck) => (
                  <div
                    key={deck.id}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                      selectedDeck?.id === deck.id
                        ? 'bg-accent/10 text-accent'
                        : 'hover:bg-default/40'
                    }`}
                    onClick={() => handleSelectDeck(deck)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{deck.name}</p>
                      <p className="text-xs text-muted">{t('cardCount', { count: deck.cardCount })}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" className="p-1 rounded hover:bg-default/60 cursor-pointer">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-default/60 text-danger cursor-pointer">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Cards column */}
        <div className={`${!selectedDeck || selectedCard ? 'hidden md:block' : ''}`}>
          <Card className="h-full md:min-h-125">
            <Card.Content>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SquareStack className="size-4 text-emerald-500" />
                  <span className="font-semibold text-sm">{t('cards')}</span>
                </div>
                {selectedDeck && (
                  <button type="button" className="p-1 rounded-lg hover:bg-default/40 transition-colors text-accent cursor-pointer">
                    <Plus className="size-4" />
                  </button>
                )}
              </div>
              {selectedDeck ? (
                currentCards.length === 0 ? (
                  <p className="text-sm text-muted py-4 text-center">{t('emptyCards')}</p>
                ) : (
                  <div className="space-y-1">
                    {currentCards.map((card) => (
                      <div
                        key={card.id}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                          selectedCard?.id === card.id
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-default/40'
                        }`}
                        onClick={() => setSelectedCard(card)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{card.front}</p>
                          <p className="text-xs text-muted truncate">{card.back}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted" />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted py-4 text-center">{t('emptyCards')}</p>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Facts/Detail column */}
        <div className={`${!selectedCard ? 'hidden md:block' : ''}`}>
          {selectedCard ? (
            <Card className="md:min-h-125">
              <Card.Content>
                {/* Card preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-default/30 p-4">
                    <p className="text-xs text-muted mb-1 font-medium">{t('front')}</p>
                    <p className="text-xl font-bold">{selectedCard.front}</p>
                  </div>
                  <div className="rounded-xl bg-default/30 p-4">
                    <p className="text-xs text-muted mb-1 font-medium">{t('back')}</p>
                    <p className="text-xl font-bold">{selectedCard.back}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Facts */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-500" />
                    <span className="font-semibold text-sm">
                      {t('facts')} ({selectedCard.facts.length})
                    </span>
                  </div>
                  <button type="button" className="p-1 rounded-lg hover:bg-default/40 transition-colors text-accent cursor-pointer">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCard.facts.map((fact, idx) => (
                    <Chip key={idx} variant="secondary" className="cursor-default">
                      {fact}
                    </Chip>
                  ))}
                </div>
              </Card.Content>
            </Card>
          ) : (
            <Card className="h-full md:min-h-125">
              <Card.Content>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Lightbulb className="size-10 text-muted mb-3 opacity-40" />
                  <p className="text-sm text-muted">
                    {t('emptyFacts')}
                  </p>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>

      {/* Create Deck Modal */}
      <Modal.Backdrop isOpen={createDialog.isOpen} onOpenChange={createDialog.setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t('createDeck')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <AppInput
                  label={t('deckName')}
                  name="name"
                  variant="secondary"
                  isRequired
                />
                <AppTextarea
                  label={t('deckDescription')}
                  name="description"
                  variant="secondary"
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <AppButton variant="secondary" onClick={createDialog.close}>
                {t('cancel')}
              </AppButton>
              <AppButton onClick={createDialog.close}>
                {t('save')}
              </AppButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  )
}
