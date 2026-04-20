'use client'

import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@heroui/react'
import { Info, Plus } from 'lucide-react'
import DecksCard from '@/components/decks/DecksCard'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import AppLink from '@/components/app/AppLink'

export default function DecksList({
  data,
}: {
  data: Deck[]
}) {
  const t = useTranslations()

  return (
    <div className="py-4 max-w-content mx-auto px-3.5 min-h-[calc(100vh-19.375rem)] md:min-h-[calc(100vh-16.625rem)]">
      <div className=" max-w-content w-full md:px-6 mx-auto">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-4 pl-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-foreground text-base font-semibold">
                {t('decks.all-decks')} ({data.length})
              </span>
              <Tooltip delay={0}>
                <Tooltip.Trigger>
                  <AppLink className="hover:text-accent" href={'/guide/getting-started/decks'}>
                    <Info className="size-4" />
                  </AppLink>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>What`s Deck?</p>
                </Tooltip.Content>
              </Tooltip>
            </div>
          </div>

          {/* Right side: Sort, layout, search */}
          <div className="flex items-center gap-2">
            <AppButtonLink href="/decks/create">
              <Plus />
              {t('decks.create-deck')}
            </AppButtonLink>
            {/* <DecksSortDropdown items={sortOptions} sort={sort} onSetSort={setSort} />

          <DecksCardLayoutModeToggle mode={mode} setMode={setMode} /> */}

            {/* Search field */}
            {/* <SearchField>
            <SearchField.Group>
              <SearchField.Input
                placeholder={t('search.placeholder')}
                className="w-50"
              />
            </SearchField.Group>
          </SearchField> */}
          </div>
        </div>

        {/* Content placeholder */}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {
            data.map((item)=>{
              return (
                <DecksCard
                  key={item.id}
                  deck={item}
                />
              )
            })
          }
        </div>
      </div>
    </div>
  )
}






