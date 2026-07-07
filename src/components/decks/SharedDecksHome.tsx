'use client'

import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'
import { useTranslations } from 'next-intl'
import { SearchField } from '@heroui/react'
import { useCallback, useState } from 'react'
import SharedDecksCard from '@/components/decks/SharedDecksCard'
import AppButton from '@/components/app/AppButton'
import { useRouter } from 'next/navigation'

export default function SharedDecksHome({
  data,
}: {
  data: DeckCatalogItem[]
}) {
  const t = useTranslations()
  const [keywords, setKeywords] = useState('')
  const router = useRouter()

  const toSharedPage = useCallback(() => {
    router.push(`/decks/shared?query=${keywords}`)
  }, [router, keywords])

  return (
    <div className=" p-6 rounded-2xl border border-gray-200 dark:border-gray-700  transition-all duration-300 mt-4">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {t('deck-sharing.heading')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('deck-sharing.subtitle')}
        </p>
      </div>

      <div className="flex items-center mb-4 gap-2">
        <SearchField
          value={keywords}
          onChange={setKeywords}
          name="search"
          aria-label={t('common.search')}
          variant="secondary"
          className=" w-full  flex-1"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              aria-label={t('common.search')}
              placeholder={t('deck-sharing.search-placeholder')}
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <AppButton onClick={toSharedPage}>{t('common.search')}</AppButton>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {
          data.map((item) => (
            <SharedDecksCard
              variant="secondary"
              key={item.id}
              deck={item}
            />
          ))
        }
      </div>
    </div>
  )
}
