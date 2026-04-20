import { AppButtonLink } from '@/components/app/AppButtonLink'
import DecksDeleteButton from '@/components/decks/DecksDeleteButton'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip, ProgressCircle } from '@heroui/react'

interface DecksCardProps {
  deck: Deck,
}

export default function DecksCard({
  deck,
}: DecksCardProps) {
  return (
    <Card
      variant="default"
      className="hover:cursor-pointer hover:shadow-lg"
    >
      <div>
        <Card.Header>
          <div className="flex">
            <Card.Title className="text-xl">
              {deck.name}
            </Card.Title>
            <ProgressCircle
              aria-label="Loading"
              className={'ml-auto sm:ml-2 shrink-0'}
              value={deck.rate}
            >
              <ProgressCircle.Track strokeWidth={6} viewBox="0 0 36 36">
                <ProgressCircle.TrackCircle cx={18} cy={18} r={15} strokeWidth={6} />
                <ProgressCircle.FillCircle cx={18} cy={18} r={15} strokeWidth={6} />
              </ProgressCircle.Track>
            </ProgressCircle>
          </div>

        </Card.Header>
        <Card.Content className="mt-2">
          <div className="flex gap-1 text-muted text-xs items-center font-bold ">
            <span>{'Field'}: </span>
            {Array.isArray(deck.fields) ? deck.fields.map((e, index)=>{
              return (
                <Chip key={index} size="sm">
                  {e}
                </Chip>
              )
            }) : (
              <Chip size="sm">{deck.fields}</Chip>
            )}
          </div>
          <Card.Description className="flex gap-1 text-xs items-center">
            <span>Rate: {deck.rate}</span>
            <span>|</span>
            <span>Cards: {deck.stats.cards_count}</span>
            <span>|</span>
            <span>Facts: {deck.stats.facts_count}</span>
            <span>|</span>
            <span>Due: {deck.stats.due_cards}</span>
          </Card.Description>
        </Card.Content>
        <Card.Footer className="grid md:flex gap-2 md:justify-between">
          <p className="flex gap-1 text-xs items-center">
            <span>Last reviewed at: {new Date(deck.stats.last_reviewed_at * 1e3).toLocaleDateString()}</span>
          </p>
          <div className="flex gap-1 justify-end">
            <AppButtonLink href={`/decks/${deck.id}`} size="sm" variant="secondary">
              details
            </AppButtonLink>
            <AppButtonLink href={`/decks/${deck.id}/edit`} size="sm" variant="secondary">
              edit
            </AppButtonLink>
            <DecksDeleteButton deckId={deck.id} />
          </div>
        </Card.Footer>
      </div>
    </Card>
  )
}


