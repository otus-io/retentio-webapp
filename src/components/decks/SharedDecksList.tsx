'use client'

import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'
import { useTranslations } from 'next-intl'
import { FolderOpen } from 'lucide-react'
import SharedDecksCard from '@/components/decks/SharedDecksCard'
import LayoutPage from '@/components/layout/LayoutPage'
import { SearchField } from '@heroui/react'
import useSearchParamsQuery from '@/hooks/useSearchParamsQuery'
import clsx from 'clsx'
import TablePagination from '@/components/common/TablePagination'

export default function SharedDecksList({
  data,
  totalPages,
}: {
  data: DeckCatalogItem[]
  totalPages: number
}) {
  const t = useTranslations()
  const { getParam, setParamsDebounced, isPending } = useSearchParamsQuery(['page', 'limit', 'query'])
  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: '/decks/shared', title: t('deck-sharing.title') },
      ]}
    >
      <div className={clsx(isPending && 'opacity-50')}>
        <div className="mb-4">
          <SearchField
            name="search"
            aria-label={t('common.search')}
            className=" w-full  flex-1"
            defaultValue={getParam('query')}
            onChange={(query) => setParamsDebounced({
              query,
              page: '1',
            })}
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
        </div>
        {
          data.length === 0
            ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted">
                <FolderOpen size={48} />
                <p>{t('deck-sharing.empty')}</p>
              </div>
            )
            : (
              <>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {
                    data.map((item) => (
                      <SharedDecksCard
                        key={item.id}
                        deck={item}
                      />
                    ))
                  }
                </div>
                <TablePagination className="mt-4" totalPages={totalPages} />
              </>
            )
        }
      </div>

    </LayoutPage>
  )

}
