/* eslint-disable react-refresh/only-export-components -- test-only module of mocks */
import { createContext, useContext, useState, type ReactNode } from 'react'

interface Props {
  children?: ReactNode | ((...args: unknown[]) => ReactNode)
  [key: string]: unknown
}

const MenuContext = createContext<((key: string) => void) | undefined>(undefined)

function render(children: Props['children']) {
  return typeof children === 'function' ? null : children
}

const overrides: Record<string, (props: Props) => ReactNode> = {
  'Modal.Backdrop': ({ children, isOpen }) => (isOpen ? <div role="dialog">{render(children)}</div> : null),
  'AlertDialog.Backdrop': ({ children, isOpen, onOpenChange }) => (isOpen
    ? (
      <div role="alertdialog">
        <button type="button" onClick={() => (onOpenChange as (v: boolean) => void)(false)}>dismiss</button>
        {render(children)}
      </div>
    )
    : null),
  'Dropdown.Menu': ({ children, onAction }) => (
    <MenuContext.Provider value={onAction as (key: string) => void}>{render(children)}</MenuContext.Provider>
  ),
  'Dropdown.Item': function Item({ children, id }) {
    const onAction = useContext(MenuContext)
    return <button type="button" onClick={() => onAction?.(String(id))}>{render(children)}</button>
  },
  Checkbox: ({ children, isSelected, onChange, isDisabled }) => (
    <label>
      <input
        type="checkbox"
        checked={!!isSelected}
        disabled={!!isDisabled}
        onChange={() => (onChange as (v: boolean) => void)?.(!isSelected)}
      />
      {render(children)}
    </label>
  ),
  Slider: ({ children, value, minValue, maxValue, onChange, ...rest }) => (
    <div>
      <input
        type="range"
        aria-label={rest['aria-label'] as string}
        value={value as number}
        min={minValue as number}
        max={maxValue as number}
        onChange={(e) => (onChange as (v: number) => void)(Number(e.target.value))}
      />
      {render(children)}
    </div>
  ),
  Spinner: () => <div role="status" />,
  Form: ({ children, action }) => <form action={action as never}>{render(children)}</form>,
}

const cache = new Map<string, unknown>()

function component(name: string): unknown {
  if (cache.has(name)) return cache.get(name)
  const base = overrides[name] ?? (({ children }: Props) => <div>{render(children)}</div>)
  const proxy = new Proxy(base, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^[A-Z]/.test(key)) return component(`${name}.${key}`)
      return Reflect.get(target, key, receiver)
    },
  })
  cache.set(name, proxy)
  return proxy
}

export function useOverlayState() {
  const [isOpen, setOpen] = useState(false)
  return { isOpen, setOpen, open: () => setOpen(true), close: () => setOpen(false), toggle: () => setOpen((v) => !v) }
}

/** Factory for `vi.mock('@heroui/react', ...)`. */
export function herouiMock() {
  return new Proxy({ useOverlayState, toast: { success: () => {}, danger: () => {} }, buttonVariants: () => 'btn' }, {
    get(target, key) {
      if (key in target) return target[key as keyof typeof target]
      if (typeof key === 'string' && /^[A-Z]/.test(key)) return component(key)
      return undefined
    },
    has: () => true,
  })
}

export function AppButtonMock({ children, onPress, isDisabled, isPending, icon: _icon, slot: _slot, variant: _v, ...rest }: Props) {
  return (
    <button type={(rest.type as 'button') ?? 'button'} onClick={onPress as () => void} disabled={!!isDisabled || !!isPending}>
      {render(children)}
    </button>
  )
}

export function AppSelectMock({ items, value, onChange, label }: Props) {
  return (
    <label>
      {label as ReactNode}
      <select value={value as string} onChange={(e) => (onChange as (v: string | null) => void)(e.target.value || null)}>
        {(items as { id: string, name: string }[]).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  )
}
