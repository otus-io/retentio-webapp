import { SearchField } from '@heroui/react'
import { useTranslations } from 'next-intl'

export function DecksSearch({
  value,
  setValue,
}: {
  value: string
  setValue: (value: string) => void
}) {

  const t = useTranslations()
  return (
    <SearchField
      value={value}
      onChange={setValue}
      name="search"
      aria-label={t('common.search')}
      className={'flex-1'}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input
          aria-label={t('common.search')}
          placeholder={t('common.search')}
        />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
}
