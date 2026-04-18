'use client'

import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import { Breadcrumbs, SearchField } from '@heroui/react'
import { Home } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DecksSortDropdown } from '@/components/decks/DecksSortDropdown'
import { DecksCardLayoutMode, DecksCardLayoutModeToggle } from '@/components/decks/DecksLayoutModeToggle'
import DecksCard from '@/components/decks/DecksCard'

export default function DecksList({
  data,
}: {
  data: Deck[]
}) {
  const t = useTranslations()

  const totalCards = useMemo(()=>{
    return data.reduce((sum, deck) => sum + deck.stats.cards_count, 0)
  }, [data])


  const [mode, setMode] = useState<DecksCardLayoutMode>('grid')

  const sortOptions = [
    { label: t('decks.created-at'), key: 'created_at' },
    { label: t('decks.updated-at'), key: 'updated_at' },
  ]

  const [sort, setSort] = useState(sortOptions[0].key)

  return (
    <div className="py-6 max-w-content w-full px-4 md:px-6 mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs>
          <Breadcrumbs.Item href="/">
            <Home className="size-4 inline mr-1 align-middle" />
            {t('nav.home')}
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>
            {t('nav.decks')}
          </Breadcrumbs.Item>
        </Breadcrumbs>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {/* Left side: Title and count */}
        <div className="flex items-center gap-2">
          <span className="text-foreground text-base font-semibold">
            {t('decks.all-decks')}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-default/50 text-xs font-medium">
            {data.length}
          </span>
          {totalCards > 0 && (
            <span className="text-sm text-muted">
              ({totalCards} cards)
            </span>
          )}
        </div>

        {/* Right side: Sort, layout, search */}
        <div className="flex items-center gap-2">
          <DecksSortDropdown items={sortOptions} sort={sort} onSetSort={setSort} />

          <DecksCardLayoutModeToggle mode={mode} setMode={setMode} />

          {/* Search field */}
          <SearchField>
            <SearchField.Group>
              <SearchField.Input
                placeholder={t('search.placeholder')}
                className="w-50"
              />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {/* Content placeholder */}
      <div className="rounded-xl border-2 border-dashed border-default/30 p-12 text-center">
        {
          data.map((item)=>{
            return <DecksCard key={item.id} deck={item} layoutMode={mode} />
          })
        }
      </div>
    </div>
  )
}






