import { AppButtonLink } from '@/components/app/AppButtonLink'
import { useBreakpointContext } from '@/context/BreakpointContext'
import { Plus } from 'lucide-react'

export default function DeckCreateButton() {
  const { md } = useBreakpointContext()
  return (
    <AppButtonLink
      variant="outline"
      size={ md?undefined:'sm'}
      href="/decks/create"
      isIconOnly
    >
      <Plus className="text-muted" />
    </AppButtonLink>
  )
}
