'use client'
import '@/components/MDX/github-markdown.css'
import useAnchorScroll from '@/hooks/useAnchorScroll'

export default function MDXPage({ children }: { children?: React.ReactNode }) {
  useAnchorScroll()
  return (
    <article className="markdown-body w-full py-12 px-4">
      {children}
    </article>
  )
}
