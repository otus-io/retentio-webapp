import MDXPage from '@/components/MDX/MDXPage'
import GuideLocaleFallbackNotice from '@/components/guide/GuideLocaleFallbackNotice'
import { APP_DESC, APP_NAME, SITE_URL } from '@/config'
import type { Locale } from '@/lib/locale.server'
import { getLocale } from '@/lib/locale.server'
import { DEFAULT_LOCALE } from '@/lib/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'


interface Frontmatter {
  title?: string
  description?: string
}

interface DocModule {
  default: React.ComponentType
  frontmatter?: Frontmatter
}

function getDocPath(slug: string[]) {
  return slug.length === 0 ? 'index' : slug.join('/')
}

async function tryImportDoc(locale: Locale, slug: string[]) {
  try {
    const path = getDocPath(slug)
    return (await import(`@/content/${locale}/${path}.mdx`)) as DocModule
  } catch {
    return null
  }
}

async function resolveDocWithFallback(locale: Locale, slug: string[]) {
  const localizedDoc = await tryImportDoc(locale, slug)
  if (localizedDoc?.default) {
    return {
      doc: localizedDoc,
      isFallback: false,
    }
  }

  if (locale !== DEFAULT_LOCALE) {
    const defaultDoc = await tryImportDoc(DEFAULT_LOCALE, slug)
    if (defaultDoc?.default) {
      return {
        doc: defaultDoc,
        isFallback: true,
      }
    }
  }
  return null
}

function guideCanonical(slug?: string[]): string {
  const tail = slug?.length ? slug.join('/') : ''
  return tail ? `${SITE_URL}/guide/${tail}` : `${SITE_URL}/guide`
}

function getMetadataFromFrontmatter(frontmatter?: Frontmatter, slug?: string[]): Metadata {
  const canonical = guideCanonical(slug)
  if (!frontmatter) {
    return {
      title: APP_NAME,
      description: APP_DESC,
      alternates: { canonical },
    }
  }

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical },
  }
}

export default async function Page(props: PageProps<'/guide/[[...slug]]'>) {
  const slug = (await props.params).slug ?? []
  const locale = await getLocale()
  const resolvedDoc = await resolveDocWithFallback(locale, slug)

  if (!resolvedDoc) {
    notFound()
  }

  const Context = resolvedDoc.doc.default

  return (
    <MDXPage>
      {resolvedDoc.isFallback && <GuideLocaleFallbackNotice />}
      <Context />
    </MDXPage>
  )
}


export async function generateMetadata(
  { params }: PageProps<'/guide/[[...slug]]'>,
): Promise<Metadata> {
  const slug = (await params).slug ?? []
  const locale = await getLocale()
  const resolvedDoc = await resolveDocWithFallback(locale, slug)
  return getMetadataFromFrontmatter(resolvedDoc?.doc.frontmatter, slug)
}
