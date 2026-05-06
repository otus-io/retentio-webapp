import AppButton from '@/components/app/AppButton'
import { Modal, UseOverlayStateReturn } from '@heroui/react'
import { ImageIcon, MicIcon, VideoIcon } from 'lucide-react'

export interface FactsCellAttachmentPreviewProps extends UseOverlayStateReturn {
  file?: string
  fileType?: 'audio' | 'image' | 'video'
}

export default function FactsCellAttachmentPreview({
  file,
  fileType,
  ...state
}: FactsCellAttachmentPreviewProps) {
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
