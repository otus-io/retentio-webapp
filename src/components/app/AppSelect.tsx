'use client'

import type { Key, SelectProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { Label, ListBox, Select } from '@heroui/react'
import { useState } from 'react'

export interface AppSelectItem {
  id: string
  name: string
}

export interface AppSelectProps extends Omit<SelectProps<AppSelectItem>, 'children' | 'items'> {
  items: AppSelectItem[]
  label: ReactNode
}

export default function AppSelect({
  items,
  label,
  value: controlledValue,
  onChange,
  className,
  placeholder,
  ...rest
}: AppSelectProps) {
  const [state, setState] = useState<Key | null>((controlledValue as Key | null) ?? null)

  const value = (controlledValue as Key | null) ?? state

  function handleChange(value: Key | null) {
    if (controlledValue === undefined) {
      setState(value)
    }
    onChange?.(value)
  }

  return (
    <Select
      {...rest}
      className={className ?? 'w-[256px]'}
      placeholder={placeholder ?? 'Select an option'}
      value={value}
      onChange={handleChange}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
              {item.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}
