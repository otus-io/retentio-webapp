'use server'

import { DEFAULT_LOCALE } from '@/lib/locale'
import { getLocale, type Locale } from '@/lib/locale.server'

export type LegalDocId = 'privacy' | 'terms'

interface LegalDocFrontmatter {
  title?: string
  description?: string
  effectiveDate?: string
}

export interface LegalDocModule {
  default: React.ComponentType
  frontmatter?: LegalDocFrontmatter
}

async function tryImportLegalDoc(locale: Locale, docId: LegalDocId) {
  try {
    return (await import(`@/content/${locale}/legal/${docId}.mdx`)) as LegalDocModule
  } catch {
    return null
  }
}

export async function loadLegalDoc(docId: LegalDocId) {
  const locale = await getLocale()
  const localizedDoc = await tryImportLegalDoc(locale, docId)

  if (localizedDoc?.default) {
    return {
      doc: localizedDoc,
      isFallback: false,
    }
  }

  if (locale !== DEFAULT_LOCALE) {
    const defaultDoc = await tryImportLegalDoc(DEFAULT_LOCALE, docId)
    if (defaultDoc?.default) {
      return {
        doc: defaultDoc,
        isFallback: true,
      }
    }
  }

  return null
}
