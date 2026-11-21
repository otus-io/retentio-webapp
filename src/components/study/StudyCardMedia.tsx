'use client'

import { getMedia } from '@/api/media'
import { parseMediaUrl } from '@/modules/cards/cards.schema'
import { Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'

interface StudyCardMediaProps {
  url: string
  kind: 'image' | 'video'
  alt: string
}

/** Media needs the bearer token, so download it and show an object URL. */
export default function StudyCardMedia({ url, kind, alt }: StudyCardMediaProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    const { id, version } = parseMediaUrl(url)
    getMedia(id, undefined, version)
      .then((res) => {
        if (cancelled) {
          URL.revokeObjectURL(res.url)
          return
        }
        objectUrl = res.url
        setSrc(res.url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (failed) return null
  if (!src) return <Spinner className="size-5" />
  return kind === 'image'
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt={alt} className="max-h-64 max-w-full rounded-lg object-contain" />
    : <video src={src} controls className="max-h-64 max-w-full rounded-lg" />
}
