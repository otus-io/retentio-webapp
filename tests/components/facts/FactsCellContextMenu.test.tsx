import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FactsCellContextMenu from '@/components/facts/FactsCellContextMenu'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

describe('FactsCellContextMenu', () => {
  it('stays closed without a position', () => {
    render(<FactsCellContextMenu position={null} onAction={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('anchors at the pointer and lists attachment, tags and delete', () => {
    render(<FactsCellContextMenu position={{ x: 12, y: 34 }} onAction={vi.fn()} onClose={vi.fn()} />)
    const trigger = document.querySelector('[data-slot="dropdown-trigger"]') as HTMLElement
    expect(trigger.style.left).toBe('12px')
    expect(trigger.style.top).toBe('34px')
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
      'term.attachment',
      'term.tags',
      'common.delete',
    ])
  })

  it('reports the chosen action and closes', () => {
    const onAction = vi.fn()
    const onClose = vi.fn()
    render(<FactsCellContextMenu position={{ x: 0, y: 0 }} onAction={onAction} onClose={onClose} />)
    fireEvent.click(screen.getByText('term.tags'))
    expect(onAction).toHaveBeenCalledWith('tag')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<FactsCellContextMenu position={{ x: 0, y: 0 }} onAction={vi.fn()} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
