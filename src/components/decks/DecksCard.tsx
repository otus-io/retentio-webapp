import { DecksCardLayoutMode } from '@/components/decks/DecksLayoutModeToggle'
import { Deck } from '@/modules/decks/decks.schema'
import { Card, Chip } from '@heroui/react'

interface DecksCardProps {
  deck: Deck,
  layoutMode: DecksCardLayoutMode
}

export default function DecksCard({
  deck,
}: DecksCardProps) {
  return (
    <Card>
      <Card.Content />
      <div>
        <Card.Header className="gap-1">
          <Card.Title className="pr-8">{deck.name}{deck.rate}</Card.Title>
          <Card.Description>
            {deck.field.map((e, index)=>{
              return (
                <Chip key={index}>
                  {e}
                </Chip>
              )
            })}
          </Card.Description>
        </Card.Header>
        <Card.Footer />
      </div>
    </Card>
  )
}


