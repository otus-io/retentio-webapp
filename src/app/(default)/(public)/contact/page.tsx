import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Mail } from 'lucide-react'
import { CONTACT_EMAIL } from '@/config'

export default async function Page() {
  const t = await getTranslations('contact')

  return (
    <div className="max-w-content mx-auto px-3.5 min-h-screen pt-5 pb-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="text-default-500 mb-8 leading-relaxed">{t('description')}</p>

        <div className="rounded-xl border border-divider bg-content1 p-6 flex items-start gap-4">
          <div className="rounded-lg bg-accent/10 p-3 text-accent shrink-0">
            <Mail className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-default-500 mb-1">{t('emailLabel')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-lg font-medium text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="text-sm text-default-400 mt-3">{t('emailHint')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('contact')
  return {
    title: t('title'),
    description: t('description'),
  } satisfies Metadata
}
