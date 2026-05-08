'use client'
import { LucideRefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppLink from '@/components/app/AppLink'
import { useTranslations } from 'next-intl'

export default function AppErrorPage({
  code,
  message,
  error,
  reset,
}: {
  code: number
  message: string
  error?: Error & { digest?: string } | Error
  reset?: () => void
}) {
  const router = useRouter()
  const t = useTranslations()
  useEffect(() => {
    // Log the error to an error reporting service
    console.log(error)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[50vh] md:h-screen">
      <h1
        className="text-4xl font-bold bg-linear-to-r from-black to-gray-700 dark:from-gray-700 dark:to-gray-400 bg-clip-text text-transparent animate-bounce-in "
      >
        {code}
      </h1>
      <p className="break-all px-4 font-bold bg-linear-to-r from-gray-700 to-gray-400 bg-clip-text text-transparent">{message}</p>
      {
        code === 404 && (
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            {
              t.rich('error.not-find-desc', {
                br: () => <br />,
                back: (chunks) => <span onClick={() => router.back()} className="cursor-pointer text-primary hover:underline font-bold">{chunks}</span>,
                home: (chunks) => <AppLink href="/" className="text-primary hover:underline font-bold">{chunks}</AppLink>,
              })
            }
          </p>
        )
      }
      {
        reset && (
          <button
            onClick={reset}
            className="mt-4 flex bg-primary py-2 px-4 rounded-full items-center gap-2"
            type="button"
          >
            <LucideRefreshCcw size={14} />
            {t('common.reset')}
          </button>
        )
      }
      {
        error && 'digest' in error && (
          <p className="mt-4 cursor-pointer text-gray-500 dark:text-gray-400">
            {error?.digest ? `Error Digest: ${error.digest}` : 'An unexpected error has occurred.'}
          </p>
        )
      }
    </div>
  )
}
