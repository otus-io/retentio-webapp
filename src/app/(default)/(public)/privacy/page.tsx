import MDXPage from '@/components/MDX/MDXPage'
import LegalDocLayout from '@/components/legal/LegalDocLayout'
import { loadLegalDoc } from '@/lib/legal-doc.server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export default async function Page() {
  const resolved = await loadLegalDoc('privacy')

  if (!resolved) {
    notFound()
  }

  const Doc = resolved.doc.default

  return (
    <LegalDocLayout
      effectiveDate={resolved.doc.frontmatter?.effectiveDate}
      showFallback={resolved.isFallback}
    >
      <MDXPage>
        <Doc />
      </MDXPage>
    </LegalDocLayout>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await loadLegalDoc('privacy')

  return {
    title: resolved?.doc.frontmatter?.title,
    description: resolved?.doc.frontmatter?.description,
  } satisfies Metadata
}
