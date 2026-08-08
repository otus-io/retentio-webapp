import { AppButtonLink } from '@/components/app/AppButtonLink'
import AppTooltip from '@/components/app/AppTooltip'
import { useBreakpointContext } from '@/context/BreakpointContext'
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function DeckImportButton() {
  const t = useTranslations()
  const { md } = useBreakpointContext()

  return (
    <AppTooltip content={t('deck-sharing.import')}>
      <AppButtonLink
        variant="outline"
        size={md ? undefined : 'sm'}
        href="/decks/shared"
        isIconOnly
      >
        <Download className="text-muted" />
      </AppButtonLink>
    </AppTooltip>
  )
}
