import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { IHeaderParams } from 'ag-grid-community'
import FactsGridHeaderRenderer from '@/components/facts/FactsGridHeaderRenderer'

function renderHeader(props: Record<string, unknown> = {}) {
  const params = {
    displayName: 'Front',
    column: { getColDef: () => ({ context: { uid: 'u1' } }) },
    ...props,
  } as unknown as IHeaderParams
  return render(<FactsGridHeaderRenderer {...params} />)
}

describe('FactsGridHeaderRenderer', () => {
  it('shows the field name without a menu', () => {
    const { container } = renderHeader()
    expect(screen.getByText('Front')).toBeDefined()
    expect(container.querySelector('[data-slot="dropdown-trigger"]')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
  })

  it('renames on double-click and saves on Enter', () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    renderHeader({ onChange, onBlur })
    fireEvent.doubleClick(screen.getByText('Front'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Word' } })
    expect(onChange).toHaveBeenCalledWith('u1', 'Word')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onBlur).toHaveBeenCalled()
    expect(screen.getByText('Word')).toBeDefined()
  })
})
