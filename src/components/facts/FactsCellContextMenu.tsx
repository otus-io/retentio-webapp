'use client'

import { Dropdown, Label } from '@heroui/react'
import { ClipboardPaste, Copy, Paperclip, Tag, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type FactsCellMenuAction = 'copy' | 'paste' | 'attachment' | 'tag' | 'delete'

interface FactsCellContextMenuProps {
  /** Viewport point to open at; null keeps the menu closed. */
  position: { x: number; y: number } | null
  /** Opened on a row's ID cell: the menu acts on the whole row, so of the fact actions it only offers delete. */
  rowMenu?: boolean
  /** The row holds a fact: offer the fact actions (attachment, tags, delete) as well as copy and paste. */
  factActions?: boolean
  onAction: (action: FactsCellMenuAction) => void
  onClose: () => void
}

/** Right-click menu for a fact cell, anchored at the pointer like a spreadsheet context menu. */
export default function FactsCellContextMenu({
  position,
  rowMenu = false,
  factActions = true,
  onAction,
  onClose,
}: FactsCellContextMenuProps) {
  const t = useTranslations()
  return (
    <Dropdown
      isOpen={position !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dropdown.Trigger
        aria-label={t('common.actions')}
        className="fixed size-px opacity-0 pointer-events-none"
        style={{ left: position?.x ?? 0, top: position?.y ?? 0 }}
      >
        <span />
      </Dropdown.Trigger>
      {/* Non-modal: right-clicking another cell while the menu is open reaches the grid and opens it there. */}
      <Dropdown.Popover placement="bottom start" isNonModal>
        <Dropdown.Menu aria-label={t('common.actions')} onAction={(key) => onAction(key as FactsCellMenuAction)}>
          <Dropdown.Item id="copy" textValue="copy">
            <div className="flex items-center gap-1">
              <Copy className="size-3.5 text-muted" />
              <Label>{t('facts-grid.copy')}</Label>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="paste" textValue="paste">
            <div className="flex items-center gap-1">
              <ClipboardPaste className="size-3.5 text-muted" />
              <Label>{t('facts-grid.paste')}</Label>
            </div>
          </Dropdown.Item>
          {factActions && !rowMenu && (
            <Dropdown.Item id="attachment" textValue="attachment">
              <div className="flex items-center gap-1">
                <Paperclip className="size-3.5 text-muted" />
                <Label>{t('term.attachment')}</Label>
              </div>
            </Dropdown.Item>
          )}
          {factActions && !rowMenu && (
            <Dropdown.Item id="tag" textValue="tag">
              <div className="flex items-center gap-1">
                <Tag className="size-3.5 text-muted" />
                <Label>{t('term.tags')}</Label>
              </div>
            </Dropdown.Item>
          )}
          {factActions && (
            <Dropdown.Item id="delete" textValue="delete" variant="danger">
              <div className="flex items-center gap-1">
                <Trash2 className="size-3.5 text-danger" />
                <Label>{t('common.delete')}</Label>
              </div>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
