'use client'

import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import { Breadcrumbs } from '@heroui/react'
import { Home, Info, Plus } from 'lucide-react'
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
        <div className="flex items-center justify-between mb-2 flex-wrap gap-4 pl-2">
          {/* Left side: Title and count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-foreground text-base font-semibold">
                {t('decks.all-decks')}({data.length})
              </span>
              <AppLink className="hover:text-accent ml-2" href={'/guide/getting-started/decks'} title="What`s Deck?">
                <Info className="size-4" />
              </AppLink>
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
        <div className="grid gap-2">
          {
            data.map((item)=>{
              return <DecksCard key={item.id} deck={item} />
            })
          }
        </div>
      </div>
    </div>
  )
}






