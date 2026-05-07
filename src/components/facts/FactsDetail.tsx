'use client'

import AppButton from '@/components/app/AppButton'
import FactsAction from '@/components/facts/FactsAction'
import FactsMediaPreviewModal from '@/components/facts/FactsMediaPreviewModal'
import LayoutPage from '@/components/layout/LayoutPage'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'
import { Deck } from '@/modules/decks/decks.schema'
import { Entry, Fact } from '@/modules/facts/facts.schema'
import { Card, Chip, Spinner } from '@heroui/react'
import clsx from 'clsx'
import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface FactsDetailProps {
  fact: Fact
  deck: Deck
}

export default function FactsDetail({ fact, deck }: FactsDetailProps) {
  const t = useTranslations()

  return (
    <LayoutPage
      breadcrumbs={[
        { href: '/decks', title: t('term.decks') },
        { href: `/decks/${deck.id}`, title: deck.name },
        { href: `/decks/${deck.id}/facts`, title: t('term.facts') },
        { href: `/decks/${deck.id}/facts/${fact.id}`, title: t('common.detail') },
      ]}
    >
      <Card variant="default" className=" overflow-hidden">
        <Card.Header className="">
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0 uppercase tracking-wide pt-0.5 w-10">
                {t('term.fields')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fact.fields.map((e, i) => (
                  <Chip key={i} size="sm" className="font-medium bg-secondary/50">{e}</Chip>
                ))}
              </div>
              <div className="ml-auto">
                <FactsAction deck={deck} fact={fact} />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0 uppercase tracking-wide pt-0.5 w-10">
                {t('term.tags')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fact.tags.map((e, i) => (
                  <Chip key={i} size="sm" variant="secondary">{e.name}</Chip>
                ))}
              </div>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {t('term.entries')}
          </p>
          <ul className="flex flex-col gap-2">
            {fact.entries.map((e, i) => (
              <FactEntryItem key={i} index={i + 1} entry={e} />
            ))}
          </ul>
        </Card.Content>
      </Card>
    </LayoutPage>
  )
}


function FactEntryItem({ entry, index }: { entry: Entry; index: number }) {
  const router = useRouter()
  const {
    mediaList,
    getInputProps,
    loading,
    preview,
    upload,
    isOpen,
    setIsOpen,
    file,
    fileType,
  } = useFactsCellAttachments(entry, ()=>{
    router.refresh()
  })

  return (
    <>
      <li className="rounded-lg  bg-default/30 overflow-hidden flex">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="text-xs font-medium text-muted-foreground bg-background  rounded px-1.5 py-0.5 shrink-0 tabular-nums">
            {index}
          </span>
          <span className="text-sm font-medium text-foreground min-w-0 wrap-break-word">
            {entry.text}
          </span>
        </div>

        <div className="flex ml-auto items-center pr-2">
          {mediaList.map((item) => {
            const hasValue = !!item.value
            return (
              <button
                key={item.key}
                id={item.key}
                type="button"
                onClick={() => preview(item)}
                className={
                  clsx(
                    'flex items-center gap-2 px-3 py-2 text-left hover:bg-default/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ',
                    hasValue?'hover:cursor-pointer':'hover:cursor-not-allowed',
                  )
                }
              >
                {(hasValue && item.loading)
                  ? (
                    <Spinner className="size-3.5 shrink-0" />
                  )
                  : <item.icon className="size-3.5 shrink-0 text-muted" />}
              </button>
            )
          })}
          <input {...getInputProps()} />
          <AppButton
            onClick={upload}
            isPending={loading}
            variant="ghost"
            isIconOnly
            size="sm"
            icon={ <Upload className="size-3.5" />}
          />
        </div>
      </li>

      <FactsMediaPreviewModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        file={file}
        fileType={fileType}
      />
    </>
  )
}
