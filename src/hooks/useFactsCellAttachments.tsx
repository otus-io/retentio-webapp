import { getMedia } from '@/api/media'
import { FactsCellAttachmentPreviewProps } from '@/components/facts/FactsCellAttachmentPreview'
import { Entry } from '@/modules/facts/facts.schema'
import { UploadMediaResult } from '@/modules/media/media.schema'
import { requestClient } from '@/utils/request.client'
import { useOverlayState } from '@heroui/react'
import { ImageIcon, LucideIcon, MicIcon, VideoIcon } from 'lucide-react'
import { useCallback, useReducer, useRef, useState } from 'react'

interface MediaItem {
  key: string;
  label: string;
  icon: LucideIcon;
  loading: boolean;
  value: string | undefined;
}

const initialMediaList: MediaItem[] = []

type MediaAction =
  | { type: 'SET_LOADING'; key: string; loading: boolean }
  | { type: 'SET_VALUE'; key: string; value: string | undefined }

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

export function useFactsCellAttachments(entry?: Entry){
  const [file, setFile] = useState<FactsCellAttachmentPreviewProps['file']>()
  const [fileType, setFileType] = useState<FactsCellAttachmentPreviewProps['fileType']>()
  const cache = useRef(new Map<string, string>())
  const [loading, setLoading] = useState(false)
  const previewState = useOverlayState()

  const [mediaList, dispatch] = useReducer(mediaReducer, initialMediaList, ()=>{
    if(!entry){
      return []
    }
    return [
      { key: 'audio', label: 'Audio', icon: MicIcon, value: entry.audio, loading: false },
      { key: 'image', label: 'Image', icon: ImageIcon, value: entry.image, loading: false },
      { key: 'video', label: 'Video', icon: VideoIcon, value: entry.video, loading: false },
    ]
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
    dispatch({ type: 'SET_VALUE', key: fileType ?? '', value: data.id })
    setLoading(false)
  }, [fileType, loading])

  const handlePreview = useCallback(async (fileType: string)=> {
    const _key = fileType as Required<FactsCellAttachmentPreviewProps>['fileType']
    try {
      const media = entry?.[fileType as keyof typeof entry]
      if(!media){
        return
      }
      const cacheFile = cache.current.get(media)
      if(cacheFile){
        setFile(cacheFile)
        setFileType(_key)
      }else{
        dispatch({ type: 'SET_LOADING', key: _key, loading: true })
        const { data, success } = await getMedia(media ?? '')
        if(!success){
          return
        }
        setFile(data?.url)
        setFileType(_key)
        cache.current.set(media, data?.url)
      }
      previewState.open()
    } finally {
      dispatch({ type: 'SET_LOADING', key: _key, loading: false })
    }
  }, [entry, previewState])

  return {
    ...previewState,
    mediaList,
    file,
    fileType,
    loading,
    preview: handlePreview,
    upload: handleUpload,
  }
}
