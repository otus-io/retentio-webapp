'use client'

import { Link, Separator } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { Layers } from 'lucide-react'
import { APP_NAME } from '@/config'

export default function Footer() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto pt-12 pb-8 border-t border-divider">
      <div className="max-w-content mx-auto px-3.5">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <Layers className="size-5" />
              <span className="text-lg font-bold">{APP_NAME}</span>
            </div>
            <p className="text-sm text-default-500">
              {t('tagline')}
            </p>
          </div>

          <div className="flex gap-6">
            <Link href="#" className="text-small text-default-500 no-underline hover:underline">
              {t('privacy')}
            </Link>
            <Link href="#" className="text-small text-default-500 no-underline hover:underline">
              {t('terms')}
            </Link>
            <Link href="#" className="text-small text-default-500 no-underline hover:underline">
              {t('contact')}
            </Link>
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-xs text-default-400 text-center">
          &copy; {year} Retentio. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
