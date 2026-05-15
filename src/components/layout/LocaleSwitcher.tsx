import { setLocaleAction } from '@/modules/locale/locale.action'
import { useLocale } from 'next-intl'
import { startTransition, useMemo } from 'react'
import type { Selection } from '@heroui/react'
import { Dropdown, Label } from '@heroui/react'
import { Check, Languages } from 'lucide-react'

import { Button } from '@heroui/react'
import { locales } from '@/lib/locale'
import clsx from 'clsx'
export default function LocaleSwitcher() {
  const locale = useLocale()

  const handleSwitch = (keys: Selection) => {
    if(!keys) return
    startTransition(async () => {
      const [locale] = keys
      await setLocaleAction(`${locale}`)
    })
  }

  const currentLocale = useMemo(() => {
    return (new Set([locale])) as unknown as Selection
  }, [locale])

  return (
    <Dropdown>
      <Button
        aria-label="Languages"
        variant="ghost"
        isIconOnly
      >
        <Languages />
      </Button>
      <Dropdown.Popover isNonModal className="">
        <Dropdown.Menu
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={currentLocale}
          onSelectionChange={handleSwitch}
        >
          <Dropdown.Section>
            {locales.map((item) => {
              return (
                <Dropdown.Item
                  id={item.value}
                  textValue={item.name}
                  key={item.value}
                >
                  <Dropdown.ItemIndicator>
                    {({ isSelected }) => (isSelected ? <Check className="text-primary" /> : null)}
                  </Dropdown.ItemIndicator>
                  <Label className={clsx(locale === item.value ? 'text-primary' : '')}>{item.name}</Label>
                </Dropdown.Item>
              )
            })}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>

  )
}
