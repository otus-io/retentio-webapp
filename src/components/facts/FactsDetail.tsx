
'use client'

import LayoutPage from '@/components/layout/LayoutPage'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'
import { Deck } from '@/modules/decks/decks.schema'
import { Entry, Fact } from '@/modules/facts/facts.schema'
import { Card, Chip, Description, Spinner } from '@heroui/react'
import { useTranslations } from 'next-intl'

interface FactsDetailProps {
  fact: Fact
  deck: Deck
}

export default function FactsDetail({
  fact,
  deck,
}: FactsDetailProps) {
  const t = useTranslations()

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('nav.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/facts`, title: '词组' },
        { href: `/decks/${deck.id}/facts/${fact.id}`, title: '词组详情' },
      ]}
    >
      <Card>
        <Card.Header>
          <div className="flex gap-2">
            <span>{t('decks.fields')}:</span>
            {
              fact.fields.map((e, i)=>{
                return <span key={i}>{e}</span>
              })
            }
          </div>
          <div className="tag">
            <span>{'tags'}:</span>
            {
              fact.tags.map((e, i)=>{
                return <Chip key={i}>{e.name}</Chip>
              })
            }
          </div>
        </Card.Header>
        <Card.Content>
          <div className="w-full">
            <h1>Entries:</h1>
            <ul className="ml-auto ">
              {
                fact.entries.map((e, i)=>{
                  return (
                    <FactEntry key={i} entry={e} />
                  )
                })
              }
            </ul>
          </div>
        </Card.Content>
      </Card>
    </LayoutPage>
  )
}


function FactEntry({
  entry,
}: {
  entry: Entry
}){
  const { mediaList } = useFactsCellAttachments(entry)
  return (
    <li className="border flex items-center">
      <span className="mr-auto">{entry.text}</span>
      {mediaList.map((item) => {
        const hasValue = !!item.value
        return (
          <div
            key={item.key}
            id={item.key}
            className="flex items-center gap-1"
          >
            <item.icon className="size-4" />
            <div className="flex flex-col flex-1 ml-auto">
              <Description className="pointer-events-auto!">
                {hasValue ? (
                  <span>
                    {item.value}
                  </span>
                ) : (
                  <span className="text-muted">
                    {`No ${item.label.toLowerCase()} attached`}
                  </span>
                )}
              </Description>
            </div>

            <div className="flex items-center gap-4 w-6">
              {
                item.loading && <Spinner />
              }
            </div>
          </div>
        )
      })}
    </li>
  )
}
