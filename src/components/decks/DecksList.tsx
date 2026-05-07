'use client'

import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@heroui/react'
import { FolderOpen, CircleQuestionMark } from 'lucide-react'
import DecksCard from '@/components/decks/DecksCard'
import AppLink from '@/components/app/AppLink'
import { DecksSearch } from '@/components/decks/DecksSearch'
import { useDeferredValue, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import DeckCreateButton from '@/components/decks/DeckCreateButton'
import LayoutPage from '@/components/layout/LayoutPage'

export default function DecksList({
  data,
}: {
  data: Deck[]
}) {
  const t = useTranslations()
  const [keywords, setKeywords] = useState('')
  const deferredQuery = useDeferredValue(keywords)

  const fuse = useMemo(() =>{
    return new Fuse(data, { keys: ['name'] })
  }, [data])

  const results = useMemo(() => {
    if (!deferredQuery) return data
    return fuse.search(deferredQuery)
      .map((result) => result.item)
  }, [fuse, deferredQuery, data])

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
      ]}
    >
      <div className="md:flex gap-2 items-center my-2">
        <div className="flex flex-1 items-center gap-2  pl-1  ">
          <div className="flex items-center gap-1">
            <span className="text-foreground text-base font-semibold">
              {t('common.all', { name: t('term.decks'), count: data.length })}
            </span>
            <Tooltip delay={0}>
              <Tooltip.Trigger>
                <AppLink className="hover:text-accent" href={'/guide/getting-started/decks'}>
                  <CircleQuestionMark className="size-4" />
                </AppLink>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{t('common.what-is', { name: t('term.decks') })}</p>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>

        <div className="flex mt-2 md:mt-0 md:ml-auto items-center gap-2 min-w-0 ml-0 ">
          <DecksSearch
            value={keywords}
            setValue={setKeywords}
          />
          <DeckCreateButton />
        </div>
      </div>

      {
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted">
            <FolderOpen size={48} />
            <p>{t('common.no-data')}</p>
          </div>
        ): (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {
              results.map((item)=>{
                return (
                  <DecksCard
                    highlight={deferredQuery}
                    key={item.id}
                    deck={item}
                  />
                )
              })
            }
          </div>
        )}
    </LayoutPage>
  )
}






