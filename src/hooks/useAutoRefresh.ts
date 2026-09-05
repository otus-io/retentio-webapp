'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAutoRefreshOptions {
  interval?: number
  enabled?: boolean
}

export default function useAutoRefresh({
  interval = 5000,
  enabled = true,
}: UseAutoRefreshOptions = {}) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    const timer = window.setInterval(() => {
      router.refresh()
    }, interval)

    return () => window.clearInterval(timer)
  }, [router, interval, enabled])
}
