import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export default function Page() {
  return (
    <div className="max-w-content mx-auto px-3.5 min-h-screen pt-5">
      <h1 className="text-3xl font-bold">This is terms page.</h1>
    </div>
  )
}


export async function generateMetadata() {
  const t = await getTranslations()
  return {
    title: t('footer.terms'),
  } satisfies Metadata
}
