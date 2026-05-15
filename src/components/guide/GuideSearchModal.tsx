'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Modal } from '@heroui/react'
import { FileText, Hash, Search } from 'lucide-react'

interface SearchHeading {
  text: string
  id: string
}

interface SearchEntry {
  slug: string
  title: string
  description: string
  headings: SearchHeading[]
}

interface SearchResult {
  slug: string
  title: string
  hash?: string
  isHeading?: boolean
}

interface GuideSearchModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export default function GuideSearchModal({ isOpen, onOpenChange }: GuideSearchModalProps) {
  const t = useTranslations('search')
  const locale = useLocale()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<SearchEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset state when modal opens (adjust state during render)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }

  // Load search index
  useEffect(() => {
    if (!isOpen) return
    fetch(`/search-index/${locale}.json`)
      .then((res) => res.json())
      .then((data: SearchEntry[]) => {
        setEntries(data)
        setActiveIndex(0)
      })
      .catch(() => setEntries([]))
  }, [isOpen, locale])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Filter and flatten results: pages + matching headings
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      return entries.map((e) => ({ slug: e.slug, title: e.title }))
    }
    const q = query.toLowerCase()
    const items: SearchResult[] = []
    for (const entry of entries) {
      const titleMatch = entry.title.toLowerCase().includes(q)
      const descMatch = entry.description.toLowerCase().includes(q)
      const matchingHeadings = entry.headings.filter((h) => h.text.toLowerCase().includes(q))

      if (titleMatch || descMatch) {
        items.push({ slug: entry.slug, title: entry.title })
      }
      for (const h of matchingHeadings) {
        items.push({ slug: entry.slug, title: h.text, hash: h.id, isHeading: true })
      }
      // If page didn't match by title/desc but headings matched, also add the page entry
      if (!titleMatch && !descMatch && matchingHeadings.length > 0) {
        items.unshift({ slug: entry.slug, title: entry.title })
      }
    }
    return items
  }, [query, entries])

  const navigate = useCallback(
    (result: SearchResult) => {
      onOpenChange(false)
      const path = result.hash
        ? `/guide/${result.slug}#${result.hash}`
        : `/guide/${result.slug}`
      router.push(path)
    },
    [onOpenChange, router],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % results.length)
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + results.length) % results.length)
      }
      else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault()
        navigate(results[activeIndex])
      }
    },
    [results, activeIndex, navigate],
  )

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="blur"
      className="z-9999"
    >
      <Modal.Container placement="top" aria-label="Guide Search">
        <Modal.Dialog className="sm:max-w-xl" aria-label="Guide Search">
          {/* Search input area */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="size-5 text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted"
              placeholder={t('placeholder')}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
              onKeyDown={handleKeyDown}
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-default text-xs text-muted font-mono">
              {t('escHint')}
            </kbd>
          </div>

          {/* Results */}
          <div className="border-t border-default max-h-80 overflow-y-auto">
            {results.length === 0
              ? (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {t('noResults')}
                </div>
              )
              : (
                <ul className="py-2">
                  {results.map((item, idx) => (
                    <li key={`${item.slug}${item.hash ? `#${item.hash}` : ''}`}>
                      <button
                        type="button"
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                          item.isHeading ? 'pl-10' : ''
                        } ${
                          idx === activeIndex
                            ? 'bg-default/50'
                            : 'hover:bg-default/30'
                        }`}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        {item.isHeading
                          ? <Hash className="size-3.5 text-muted shrink-0" />
                          : <FileText className="size-4 text-muted shrink-0" />}
                        <span className={`text-sm truncate ${item.isHeading ? 'text-muted' : 'font-medium'}`}>
                          {item.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
