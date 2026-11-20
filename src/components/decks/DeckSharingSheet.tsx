'use client'

import AppError from '@/components/app/AppError'
import DeckAuthorContributionsPanel, {
  type ContributionInboxTab,
} from '@/components/decks/DeckAuthorContributionsPanel'
import DeckContributionsPanel from '@/components/decks/DeckContributionsPanel'
import DeckImportUpdatesPanel from '@/components/decks/DeckImportUpdatesPanel'
import DeckPublishPanel from '@/components/decks/DeckPublishPanel'
import { getContributionsAction } from '@/modules/contributions/contributions.action'
import type { Contribution } from '@/modules/contributions/contributions.schema'
import { getDeckImportUpdatesAction, getPublishPreviewAction } from '@/modules/deck-sharing/deck-sharing.action'
import type { DeckImportUpdatesResponseDTO, PublishPreview } from '@/modules/deck-sharing/deck-sharing.schema'
import type { Deck } from '@/modules/decks/decks.schema'
import { Modal, Spinner } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export type DeckSheetKind = 'publish' | 'inbox' | 'outbox' | 'updates'

interface Inbox {
  contributions: Contribution[]
  total: number
  loadFailed: boolean
}

interface DeckSharingSheetProps {
  deck: Deck
  kind: DeckSheetKind
  onClose: () => void
}

const titleKeys = {
  publish: 'publish-deck',
  inbox: 'contributions-inbox',
  outbox: 'pending-outbox',
  updates: 'check-updates',
} as const satisfies Record<DeckSheetKind, string>

/**
 * The deck menu's sharing sheets, like the mobile app's bottom sheets: publish, contributions inbox,
 * unsent contributions and check updates. Mounted only while open, so each open loads fresh data.
 */
export default function DeckSharingSheet({ deck, kind, onClose }: DeckSharingSheetProps) {
  const t = useTranslations('deck-menu')
  const router = useRouter()
  const [preview, setPreview] = useState<PublishPreview | null>(null)
  const [updates, setUpdates] = useState<DeckImportUpdatesResponseDTO['data'] | null>(null)
  const [tab, setTab] = useState<ContributionInboxTab>('open')
  const [inbox, setInbox] = useState<Inbox | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(kind === 'outbox')
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    const done = (failure?: unknown) => {
      if (cancelled) return
      // An empty string means the load failed without a message; the fallback is picked at render.
      if (failure !== undefined) setError(String(failure ?? ''))
      setLoaded(true)
    }
    if (kind === 'publish') {
      // A deck that was never published has nothing to compare against.
      if (deck.published_version <= 0) {
        done()
        return
      }
      void getPublishPreviewAction(deck.id).then((res) => {
        if (!cancelled && res.success && res.data) setPreview(res.data)
        done()
      })
    } else if (kind === 'updates') {
      void getDeckImportUpdatesAction(deck.id).then((res) => {
        if (!cancelled && res.success && res.data) setUpdates(res.data)
        done(res.success ? undefined : res.error ?? '')
      })
    } else if (kind === 'inbox') {
      void getContributionsAction(deck.id, tab === 'all' ? undefined : tab).then((res) => {
        if (cancelled) return
        setInbox(res.success && res.data
          ? { ...res.data, loadFailed: false }
          : { contributions: [], total: 0, loadFailed: true })
        done()
      })
    }
    return () => {
      cancelled = true
    }
  }, [kind, deck.id, deck.published_version, tab, version])

  const close = () => {
    onClose()
    // Badges and deck stats on the page may have changed.
    router.refresh()
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) close() }}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(titleKeys[kind])}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="px-1 py-2">
            {!loaded && <div className="flex justify-center py-10"><Spinner /></div>}
            <AppError error={error === '' ? t('load-failed') : error} />
            {loaded && kind === 'publish' && <DeckPublishPanel deck={deck} preview={preview} />}
            {loaded && kind === 'updates' && updates && (
              <DeckImportUpdatesPanel deckId={deck.id} updates={updates} onSynced={reload} />
            )}
            {kind === 'outbox' && <DeckContributionsPanel deck={deck} />}
            {loaded && kind === 'inbox' && inbox && (
              <DeckAuthorContributionsPanel
                deckId={deck.id}
                contributions={inbox.contributions}
                selectedTab={tab}
                total={inbox.total}
                loadFailed={inbox.loadFailed}
                onSelectTab={setTab}
                onChanged={reload}
              />
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
