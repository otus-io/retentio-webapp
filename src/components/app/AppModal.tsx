'use client'
import type { ModalDialogProps, UseOverlayStateReturn } from '@heroui/react'
import { Modal } from '@heroui/react'
import AppButton from '@/components/app/AppButton'

interface AppModalProps extends UseOverlayStateReturn {
  title?: string
  children: React.ReactNode
  onComfirm?: () => void
  onCancel?: () => void
  dialogProps?: ModalDialogProps
  footer?: false | React.ReactNode
}
export default function AppModal({
  isOpen,
  title,
  children,
  setOpen,
  close,
  onComfirm,
  onCancel,
  dialogProps,
  footer,
}: AppModalProps) {
  function handleComfirm() {
    close()
    onComfirm?.()
  }

  function handleCancel() {
    close()
    onCancel?.()
  }

  return (

    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={setOpen}
    >
      <Modal.Container>
        <Modal.Dialog {...dialogProps}>
          <Modal.CloseTrigger />
          <Modal.Header>
            {/* <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <InfoIcon className="size-5" />
            </Modal.Icon> */}
            <Modal.Heading>
              {title}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {children}
          </Modal.Body>
          {
            footer === false
              ? null
              : typeof footer === 'function'
                ? footer
                : (
                  <>
                    <Modal.Footer>
                      <AppButton
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        取消
                      </AppButton>
                      <AppButton
                        variant="primary"
                        onClick={handleComfirm}
                      >
                        确定
                      </AppButton>
                    </Modal.Footer>
                  </>
                )
          }
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>

  )
}
