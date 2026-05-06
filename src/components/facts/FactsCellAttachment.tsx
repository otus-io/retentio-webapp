import { Fact } from '@/modules/facts/facts.schema'
import { Modal, Spinner, UseOverlayStateReturn } from '@heroui/react'
import { Paperclip } from 'lucide-react'
import { Description, Label, ListBox } from '@heroui/react'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import AppButton from '@/components/app/AppButton'
import FactsCellAttachmentPreview from '@/components/facts/FactsCellAttachmentPreview'
import { useFactsCellAttachments } from '@/hooks/useFactsCellAttachments'

export interface FactsCellAttachmentProps extends UseOverlayStateReturn {
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


function FactsCellAttachmentInner({
  fact,
  fieldIndex = 0,
  ...state
}: FactsCellAttachmentProps) {
  const { file, fileType, mediaList, loading, upload, preview, ...previewState } = useFactsCellAttachments(fact?.entries[fieldIndex])
  const { getInputProps, open } = useMediaUpload({
    onAccepted: upload,
  })
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
                      onAction={() => preview(item.key)}
                    >
                      <item.icon />
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


