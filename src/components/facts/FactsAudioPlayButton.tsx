'use client'

import { getMedia, resolveImportedMediaVersion } from '@/api/media'
import { createBlobCache } from '@/lib/idb-cache'
import { Loader2, Pause, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

const mediaCache = createBlobCache('retentio', 'media-blobs')

/** Short silent clip so playback starts inside the click gesture, before the file download. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

type StopFn = () => void

let sharedStop: StopFn | null = null

export interface FactsAudioPlayButtonProps {
  mediaId: string
  className?: string
  deckId?: string
  factId?: string
  /** Imported deck: resolve snapshot `?v=` before download */
  imported?: boolean
}

function cacheKey(mediaId: string, version?: number) {
  return version && version > 0 ? `${mediaId}:v${version}` : mediaId
}

export default function FactsAudioPlayButton({
  mediaId,
  className,
  deckId,
  factId,
  imported = false,
}: FactsAudioPlayButtonProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const isSharedRef = useRef(false)
  const mountedRef = useRef(true)

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    if (isSharedRef.current) {
      sharedStop = null
      isSharedRef.current = false
    }
    setPlaying(false)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stop()
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [stop])

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (playing) {
      stop()
      return
    }

    sharedStop?.()
    sharedStop = stop
    isSharedRef.current = true
    setLoading(true)

    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.src = SILENT_WAV
    try {
      await audio.play()
    }
    catch {
      // The gesture unlock can be rejected. The real clip still plays.
    }

    try {
      let url = urlRef.current
      if (!url) {
        const version = imported && deckId && factId
          ? await resolveImportedMediaVersion(deckId, factId, mediaId)
          : undefined
        const key = cacheKey(mediaId, version)
        const cached = await mediaCache.get(key)
        if (cached) {
          url = URL.createObjectURL(cached)
        }
        else {
          const data = version && version > 0
            ? await getMedia(mediaId, undefined, version)
            : await getMedia(mediaId)
          await mediaCache.set(key, data.blob)
          url = data.url
        }
        if (!mountedRef.current) {
          if (url !== urlRef.current) {
            URL.revokeObjectURL(url)
          }
          return
        }
        urlRef.current = url
      }

      audio.src = url
      audio.onended = () => {
        stop()
      }
      await audio.play()
      setPlaying(true)
    }
    catch {
      stop()
    }
    finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [mediaId, playing, stop, imported, deckId, factId])

  const label = playing
    ? t('common.pause', { name: t('term.audio') })
    : t('common.play', { name: t('term.audio') })

  return (
    <button
      type="button"
      tabIndex={0}
      data-testid="facts-audio-play"
      className={className}
      aria-label={label}
      title={label}
      disabled={loading}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onClick={handleClick}
    >
      {loading
        ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
        : playing
          ? <Pause className="size-3.5" aria-hidden />
          : <Play className="size-3.5 fill-current" aria-hidden />}
    </button>
  )
}
