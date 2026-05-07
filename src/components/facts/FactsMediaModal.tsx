import { Entry } from '@/modules/facts/facts.schema'
import { Modal, Spinner } from '@heroui/react'
import { Paperclip } from 'lucide-react'
import { Description, Label, ListBox } from '@heroui/react'
import AppButton from '@/components/app/AppButton'
import FactsMediaPreviewModal from '@/components/facts/FactsMediaPreviewModal'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'

export interface FactsMediaModalProps {
  entry?: Entry
  id?: string
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void
  onUpload?: Parameters<typeof useFactsCellAttachments>[1]
}

export default function FactsMediaModal({
  entry,
  id,
  isOpen,
  setIsOpen,
  onUpload,
}: FactsMediaModalProps) {
  if(!entry || !isOpen){
    return null
  }
  return (
    <FactsAttachmentInner
      onUpload={onUpload}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      entry={entry}
      key={id}
    />
  )
}

function FactsAttachmentInner({
  entry,
  isOpen,
  setIsOpen,
  onUpload,
}: FactsMediaModalProps) {
  const {
    file,
    fileType,
    mediaList,
    loading,
    upload,
    getInputProps,
    preview,
    isOpen: isPreviewOpen,
    setIsOpen: setIsPreviewOpen,
  } = useFactsCellAttachments(entry, onUpload)

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
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
                      onAction={() => preview(item)}
                    >
                      <item.icon />
                      <div className="flex flex-col flex-1">
                        <Label>{item.label}</Label>
                        <Description className="pointer-events-auto!">
                          {hasValue
                            ? (
                              <span>
                                {item.value}
                              </span>
                            )
                            : (
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
                onClick={upload}
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
      <FactsMediaPreviewModal
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
        file={file}
        fileType={fileType}
      />
    </>
  )
}


