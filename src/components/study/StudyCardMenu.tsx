'use client'

import { Dropdown, Label } from '@heroui/react'
import { EllipsisVertical, EyeOff, Flag, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Key } from 'react'

interface StudyCardMenuProps {
  isDisabled: boolean
  imported: boolean
  onAction: (key: Key) => void
}

/** The study card's options: hide, edit fact, report (imports only) and delete. */
export default function StudyCardMenu({ isDisabled, imported, onAction }: StudyCardMenuProps) {
  const t = useTranslations('study')
  return (
    <Dropdown>
      <Dropdown.Trigger aria-label={t('card-options')} isDisabled={isDisabled} className="ml-auto">
        <EllipsisVertical className="size-4 text-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={onAction}>
          <Dropdown.Item id="hide" textValue={t('hide-card')}>
            <EyeOff className="size-3.5 text-muted-foreground" />
            <Label>{t('hide-card')}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="edit" textValue={t('edit-fact')}>
            <Pencil className="size-3.5 text-muted-foreground" />
            <Label>{t('edit-fact')}</Label>
          </Dropdown.Item>
          {imported
            ? (
              <Dropdown.Item id="report" textValue={t('report-issue')}>
                <Flag className="size-3.5 text-muted-foreground" />
                <Label>{t('report-issue')}</Label>
              </Dropdown.Item>
            )
            : null}
          <Dropdown.Item id="delete" textValue={t('delete-card')} variant="danger">
            <Trash2 className="size-3.5 text-danger" />
            <Label>{t('delete-card')}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
