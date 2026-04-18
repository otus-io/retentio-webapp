import AppButton from '@/components/app/AppButton'
import { Dropdown, Label, Selection } from '@heroui/react'
import clsx from 'clsx'
import { ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

export interface DecksSortDropdownProps {
  items: { label: string, key: string }[]
  sort: string
  onSetSort: (sort: string) => void
}


export function DecksSortDropdown({
  items,
  sort,
  onSetSort,
}: DecksSortDropdownProps) {
  const t = useTranslations()
  const selectedKeys = useMemo(() => {
    return new Set([sort])
  }, [sort])
  function setSelectedKeys(e: Selection){
    if(e!=='all'){
      const firstValue = Array.from(e)[0]
      onSetSort(String(firstValue))
    }
  }
  return (
    <>
      {/* Sort dropdown */}
      <Dropdown>
        <AppButton variant="secondary">
          <ArrowUpDown className="size-4" />
          {t('decks.sort-by')}
        </AppButton>
        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label="Sort options"
            selectedKeys={selectedKeys}
            selectionMode="single"
            onSelectionChange={setSelectedKeys}
          >
            {
              items.map((item) => (
                <Dropdown.Item key={item.key} textValue={item.key} id={item.key}>
                  {
                    (props)=>{
                      return (
                        <>
                          <Dropdown.ItemIndicator className={clsx(props.isSelected && 'text-accent')} />
                          <Label className={clsx(props.isSelected && 'text-accent')}>{item.label}</Label>
                        </>
                      )
                    }
                  }
                </Dropdown.Item>
              ))
            }
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </>
  )
}
