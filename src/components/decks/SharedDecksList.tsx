'use client'

import type { DeckCatalogItem } from '@/modules/deck-sharing/deck-sharing.schema'
import { useTranslations } from 'next-intl'
import { FolderOpen } from 'lucide-react'
import SharedDecksCard from '@/components/decks/SharedDecksCard'
import LayoutPage from '@/components/layout/LayoutPage'
import { Pagination, SearchField } from '@heroui/react'
import useSearchParamsQuery from '@/hooks/useSearchParamsQuery'
import { useCallback, useMemo } from 'react'

export default function SharedDecksList({
  data,
  totalPages,
}: {
  data: DeckCatalogItem[]
  totalPages: number
}) {
  const t = useTranslations()
  const { getParam, setParam, setParamDebounced } = useSearchParamsQuery(['page', 'limit', 'query'])

  const page = useMemo(() => {
    const page = Number(getParam('page'))
    return isNaN(page) ? 1 : page
  }, [getParam])
  console.log({ page })

  const setPage = useCallback((typeOrPage:'next' | 'prev' | number) => {
    if(typeof typeOrPage === 'number'){
      setParam('page', `${typeOrPage}`)
      return
    }
    const _page = typeOrPage === 'next' ? page + 1 : page - 1
    setParam('page', `${_page}`)
  }, [setParam, page])

  const query = useMemo(() => {
    return getParam('query')
  }, [getParam])


  console.log(query)
  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: '/decks/shared', title: t('deck-sharing.title') },
      ]}
    >
      <div className="mb-4">
        <SearchField
          name="search"
          aria-label={t('common.search')}
          className=" w-full  flex-1"
          defaultValue={getParam('query')}
          onChange={(query) => setParamDebounced('query', query)}
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
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {
                data.map((item) => (
                  <SharedDecksCard
                    key={item.id}
                    deck={item}
                  />
                ))
              }

              <Pagination className="justify-center">
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous isDisabled={page === 1} onPress={() => setPage('prev')}>
                      <Pagination.PreviousIcon />
                      <span>Previous</span>
                    </Pagination.Previous>
                  </Pagination.Item>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Pagination.Item key={p}>
                      <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next isDisabled={page === totalPages} onPress={() => setPage('next')}>
                      <span>Next</span>
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </div>
          )
      }
    </LayoutPage>
  )

}
