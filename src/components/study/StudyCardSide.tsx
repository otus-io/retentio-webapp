'use client'

import FactsAudioPlayButton from '@/components/facts/FactsAudioPlayButton'
import StudyCardMedia from '@/components/study/StudyCardMedia'
import { type CardEntry, parseMediaUrl } from '@/modules/cards/cards.schema'

interface StudyCardSideProps {
  entries: CardEntry[]
  deckId: string
  factId: string
  imported: boolean
}

export default function StudyCardSide({ entries, deckId, factId, imported }: StudyCardSideProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          {entry.field && <span className="text-xs uppercase tracking-wide text-muted">{entry.field}</span>}
          {(entry.text || entry.audio) && (
            <div className="flex items-center gap-2">
              {entry.text && <span className="whitespace-pre-wrap text-2xl font-medium">{entry.text}</span>}
              {entry.audio && (
                <FactsAudioPlayButton
                  mediaId={parseMediaUrl(entry.audio).id}
                  deckId={deckId}
                  factId={factId}
                  imported={imported}
                />
              )}
            </div>
          )}
          {entry.image && <StudyCardMedia url={entry.image} kind="image" alt={entry.field ?? entry.text ?? ''} />}
          {entry.video && <StudyCardMedia url={entry.video} kind="video" alt={entry.field ?? entry.text ?? ''} />}
        </div>
      ))}
    </div>
  )
}
