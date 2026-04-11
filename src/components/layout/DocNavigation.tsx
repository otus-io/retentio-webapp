'use client'

import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import AppLink from '@/components/app/AppLink'
import { useSidebar } from '@/components/layout/SidebarContext'
import clsx from 'clsx'
import { normalizePath } from '@/utils/string'


export default function DocNavigation(){
  const t = useTranslations()
  const pathname = usePathname()
  const { flattenItems: allItems } = useSidebar()
  const currentIndex = allItems.findIndex((item) => normalizePath(item.href ?? '') === normalizePath(pathname))
  const previousItem = currentIndex > 0 ? allItems[currentIndex - 1] : null
  const nextItem = currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null
  return (
    <div className="px-2">
      {(previousItem || nextItem) && (
        <div className="grid  grid-cols-1 gap-4 py-4 mx-auto md:grid-cols-2 md:py-12">
          {previousItem && (
            <AppLink
              href={previousItem.href!}
              className="flex items-center w-full px-4 md:px-5 py-6 border-2 border-transparent rounded-lg gap-x-4 md:gap-x-6 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            >
              <ChevronDown className="size-5 rotate-90 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                  {t('content.previous')}
                </span>
                <span className="text-base wrap-break-word group-hover:underline">
                  {t(previousItem.titleKey)}
                </span>
              </div>
            </AppLink>
          )}

          {nextItem && (
            <AppLink
              href={nextItem.href!}
              className={clsx(
                'flex justify-start flex-row-reverse items-center w-full px-4 md:px-5 py-6 border-2 border-transparent rounded-lg gap-x-4 md:gap-x-6 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 md:flex-row-reverse md:justify-self-end md:text-end',
                !previousItem && 'md:col-start-2',
              )}
            >
              <ChevronDown className="size-5 -rotate-90 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold tracking-wide uppercase text-gray-500 dark:text-gray-400">
                  {t('content.next')}
                </span>
                <span className="text-base wrap-break-word group-hover:underline">
                  {t(nextItem.titleKey)}
                </span>
              </div>
            </AppLink>
          )}
        </div>
      )}
    </div>
  )

}
