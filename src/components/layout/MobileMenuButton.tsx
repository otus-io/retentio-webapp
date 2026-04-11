'use client'
import clsx from 'clsx'

interface MobileMenuButtonProps {
  open: boolean
  onToggle: () => void
}

export default function MobileMenuButton({ open, onToggle }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="md:hidden flex flex-col justify-center items-center size-9 gap-1.5 cursor-pointer"
      aria-label={open ? 'Close menu' : 'Open menu'}
    >
      <span
        className={clsx(
          'block h-0.5 w-5 bg-current rounded transition-transform duration-300 origin-center',
          open && 'translate-y-1 rotate-45',
        )}
      />
      <span
        className={clsx(
          'block h-0.5 w-5 bg-current rounded transition-transform duration-300 origin-center',
          open && '-translate-y-1 -rotate-45',
        )}
      />
    </button>
  )
}
