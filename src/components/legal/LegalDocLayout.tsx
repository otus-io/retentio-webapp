import GuideLocaleFallbackNotice from '@/components/guide/GuideLocaleFallbackNotice'
import { getTranslations } from 'next-intl/server'

interface LegalDocLayoutProps {
  children: React.ReactNode
  effectiveDate?: string
  showFallback?: boolean
}

export default async function LegalDocLayout({
  children,
  effectiveDate,
  showFallback = false,
}: LegalDocLayoutProps) {
  const t = await getTranslations('legal')

  return (
    <div className="max-w-content mx-auto px-3.5 min-h-screen pt-5 pb-16">
      <div className="max-w-3xl">
        {showFallback && <GuideLocaleFallbackNotice />}
        {effectiveDate && (
          <p className="text-sm text-default-500 mb-6">
            {t('lastUpdated')}
            {': '}
            {effectiveDate}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
