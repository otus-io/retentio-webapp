import { getMedia } from '@/api/media'
import { FactsMediaPreviewModalProps } from '@/components/facts/FactsMediaPreviewModal'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { createBlobCache } from '@/lib/idb-cache'
import { Entry } from '@/modules/facts/facts.schema'
import { UploadMediaResult } from '@/modules/media/media.schema'
import { requestClient } from '@/utils/request.client'
import { ImageIcon, LucideIcon, MicIcon, VideoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useReducer, useState } from 'react'


export type MediaType = 'audio' | 'image' | 'video'

export interface MediaItem {
  key: MediaType;
  label: string;
  icon: LucideIcon;
  loading: boolean;
  value: string | undefined;
}

const initialMediaList: MediaItem[] = []

type MediaAction =
  | { type: 'SET_LOADING'; key: MediaType; loading: boolean }
  | { type: 'SET_VALUE'; key: MediaType; value: string | undefined }

function mediaReducer(state: MediaItem[], action: MediaAction) {
  switch (action.type) {
    case 'SET_LOADING':
      return state.map((item) =>
        item.key === action.key ? { ...item, loading: action.loading } : item)
    case 'SET_VALUE':
      return state.map((item) =>
        item.key === action.key ? { ...item, value: action.value } : item)
    default:
      return state
  }
}

const mediaCache = createBlobCache('retentio', 'media-blobs')


function mimeToMediaType(mime: string): MediaType {
  if(mime .startsWith('image')){
    return 'image'
  }
  if(mime.startsWith('audio')){
    return 'audio'
  }
  if(mime.startsWith('video')){
    return 'video'
  }
  throw new Error('unknown Media Type ')
}

export function useFactsCellAttachments(entry?: Entry, onUpload?: (fileId: string, mediaType: MediaType) => void){
  const t = useTranslations()
  const [file, setFile] = useState<FactsMediaPreviewModalProps['file']>()
  const [fileType, setFileType] = useState<MediaType>()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mediaList, dispatch] = useReducer(mediaReducer, initialMediaList, ()=>{
    if(!entry){
      return [] as MediaItem[]
    }
    return [
      { key: 'audio', label: t('term.audio'), icon: MicIcon, value: entry.audio, loading: false },
      { key: 'image', label: t('term.image'), icon: ImageIcon, value: entry.image, loading: false },
      { key: 'video', label: t('term.video'), icon: VideoIcon, value: entry.video, loading: false },
    ] as MediaItem[]
  })
  const handleUpload = useCallback(async(files: File[]) => {
    if(loading){
      return
    }
    setLoading(true)
    const formData = new FormData()
    formData.append('file', files[0])
    const { data } = await requestClient<UploadMediaResult>('/api/media', {
      method: 'POST',
      body: formData,
    })
    const mediaType = mimeToMediaType(data.mime)
    dispatch({
      type: 'SET_VALUE',
      key: mediaType,
      value: data.id,
    })
    onUpload?.(data.id, mediaType)
    setLoading(false)
  }, [loading, onUpload])

  const handlePreview = useCallback(async (item: MediaItem)=> {
    try {
      const media = item.value
      if(!media){
        return
      }
      const cachedBlob = await mediaCache.get(media)
      if(cachedBlob){
        setFile(URL.createObjectURL(cachedBlob))
        setFileType(item.key)
      }else{
        dispatch({ type: 'SET_LOADING', key: item.key, loading: true })
        const { data, success } = await getMedia(media ?? '')
        if(!success){
          return
        }
        setFile(data?.url)
        setFileType(item.key)
        await mediaCache.set(media, data.blob)
      }
      setIsOpen(true)
    } finally {
      dispatch({ type: 'SET_LOADING', key: item.key, loading: false })
    }
  }, [setIsOpen])


  const { getInputProps, open: upload } = useMediaUpload({
    onAccepted: handleUpload,
  })

  return {
    isOpen,
    mediaList,
    file,
    fileType,
    loading,
    setIsOpen,
    preview: handlePreview,
    upload: upload,
    getInputProps,
  }
}
