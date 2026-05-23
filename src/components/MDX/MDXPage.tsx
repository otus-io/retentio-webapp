'use client'
import '@/components/MDX/github-markdown.css'

export default function MDXPage({ children }: { children?: React.ReactNode }) {
  return (
    <article className="markdown-body w-full py-12 px-4">
      {children}
    </article>
  )
}
