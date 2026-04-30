import { Fact } from '@/modules/facts/facts.schema'
import { Modal, Spinner, useOverlayState, UseOverlayStateReturn } from '@heroui/react'
import { ImageIcon, MicIcon, Paperclip, VideoIcon } from 'lucide-react'
import { Description, Label, ListBox } from '@heroui/react'
import { JSX, useCallback, useReducer, useState } from 'react'
import { getMedia } from '@/api/media'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { requestClient } from '@/utils/request.client'
import { UploadMediaResult } from '@/modules/media/media.schema'
import AppButton from '@/components/app/AppButton'


interface FactsCellAttachmentProps extends UseOverlayStateReturn {
  fact?: Fact
  fieldIndex?: number
}

export default function FactsCellAttachment(props: FactsCellAttachmentProps) {
  if(!props.fact || !props.isOpen){
    return null
  }
  return (
    <FactsCellAttachmentInner {...props} key={props.fact.id} />
  )
}

interface MediaItem {
  key: string;
  label: string;
  icon: JSX.Element;
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


function FactsCellAttachmentInner({
  fact,
  fieldIndex = 0,
  ...state
}: FactsCellAttachmentProps) {
  const entries = fact?.entries?.[fieldIndex]
  const previewState = useOverlayState()
  const [file, setFile] = useState<FactsCellAttachmentPreviewProps['file']>()
  const [fileType, setFileType] = useState<FactsCellAttachmentPreviewProps['fileType']>()
  const [mediaList, dispatch] = useReducer(mediaReducer, initialMediaList, ()=>{
    if(!entries){
      return []
    }
    return [
      { key: 'audio', label: 'Audio', icon: <MicIcon />, value: entries.audio, loading: false },
      { key: 'image', label: 'Image', icon: <ImageIcon />, value: entries.image, loading: false },
      { key: 'video', label: 'Video', icon: <VideoIcon />, value: entries.video, loading: false },
    ]
  })

  const [loading, setLoading] = useState(false)

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

  const { getInputProps, open } = useMediaUpload({
    onAccepted: handleUpload,
  })

  const handleAction = useCallback(async (key: string)=> {
    const _key = key as Required<FactsCellAttachmentPreviewProps>['fileType']
    try {
      const media = entries?.[key as keyof typeof entries]
      if(!media){
        return
      }
      dispatch({ type: 'SET_LOADING', key: fileType ?? '', loading: true })
      const { data } = await getMedia(media ?? '')
      setFile(data?.url)
      setFileType(_key)
      previewState.setOpen(true)
    } finally {
      dispatch({ type: 'SET_LOADING', key: fileType ?? '', loading: false })
    }
  }, [entries, fileType, previewState])

  return (
    <>
      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Paperclip
                  className="size-5"
                />
              </Modal.Icon>
              <Modal.Heading>Attachment</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <ListBox aria-label="Attachment">
                {mediaList.map((item) => {
                  const hasValue = !!item.value
                  return (
                    <ListBox.Item
                      key={item.key}
                      id={item.key}
                      textValue={item.label}
                      onAction={() => handleAction(item.key)}
                    >
                      {item.icon}
                      <div className="flex flex-col flex-1">
                        <Label>{item.label}</Label>
                        <Description className="pointer-events-auto!">
                          {hasValue ? (
                            <span>
                              {item.value}
                            </span>
                          ) : (
                            <span className="text-muted">
                              {`No ${item.label.toLowerCase()} attached`}
                            </span>
                          )}
                        </Description>
                      </div>

                      <div className="flex items-center gap-4 w-6">
                        {
                          item.loading && <Spinner />
                        }
                      </div>
                    </ListBox.Item>
                  )
                })}
              </ListBox>
            </Modal.Body>
            <Modal.Footer>
              <input {...getInputProps()} />
              <AppButton
                onClick={open}
                isPending={loading}
              >
                Upload
              </AppButton>
              <AppButton slot="close" variant="secondary">
                Close
              </AppButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <FactsCellAttachmentPreview {...previewState} file={file} fileType={fileType} />
    </>

  )
}

interface FactsCellAttachmentPreviewProps extends UseOverlayStateReturn {
  file?: string
  fileType?: 'audio' | 'image' | 'video'
}

export function FactsCellAttachmentPreview(
  {
    file,
    fileType,
    ...state
  }: FactsCellAttachmentPreviewProps,
) {

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-90">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-default text-foreground">
              {
                fileType === 'audio' && <MicIcon className="size-5" />
              }
              {
                fileType === 'image' && <ImageIcon className="size-5" />
              }
              {
                fileType === 'video' && <VideoIcon className="size-5" />
              }
            </Modal.Icon>
            <Modal.Heading>Attachment Preview</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="py-4">
              {
                fileType === 'audio' && (
                  <audio controls className="w-full" src={file} />
                )
              }
              {
                fileType === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file}
                    alt="attachment"
                    className="max-w-full w-full max-h-[80vh] object-contain"
                  />
                )
              }
              {
                fileType === 'video' && (
                  <video
                    src={file}
                    controls
                    className="max-w-full w-full max-h-[80vh] object-contain"
                  />
                )
              }
            </div>
          </Modal.Body>
          <Modal.Footer>
            <AppButton className="w-full" slot="close">
              Continue
            </AppButton>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
