import AppButton from '@/components/app/AppButton'
import { MediaType } from '@/hooks/useFactsCellAttachments'
import { Modal } from '@heroui/react'
import { ImageIcon, MicIcon, VideoIcon } from 'lucide-react'

export interface FactsMediaPreviewModalProps {
  file?: string
  fileType?: MediaType
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void
}

export default function FactsMediaPreviewModal({
  file,
  fileType,
  isOpen,
  setIsOpen,
}: FactsMediaPreviewModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
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
