import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { Grid3x3, List } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Key, useMemo } from 'react'


export type DecksCardLayoutMode = 'grid' | 'list'

export interface DecksCardLayoutModeToggleProps {
  mode: DecksCardLayoutMode
  setMode: (mode: DecksCardLayoutMode) => void
}

export function DecksCardLayoutModeToggle({
  mode: mode,
  setMode: setMode,
}: DecksCardLayoutModeToggleProps) {
  const t = useTranslations()
  const selectedKeys = useMemo(() => {
    return new Set([mode])
  }, [mode])

  function setSelectedKeys(e: Set<Key>){
    const firstValue = Array.from(e)[0]
    setMode(String(firstValue) as DecksCardLayoutMode)
  }

  return (
    <ToggleButtonGroup
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
      aria-label="Toggle Layout Mode"
    >
      <ToggleButton
        key="grid"
        isIconOnly
        id="grid"
        aria-label={t('decks.layout-grid')}
      >
        <Grid3x3 className="size-4" />
      </ToggleButton>
      <ToggleButton
        key="list"
        isIconOnly
        id="list"
        aria-label={t('decks.layout-list')}
      >
        <List className="size-4" />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
