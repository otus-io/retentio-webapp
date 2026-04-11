'use client'
import type { UseOverlayStateReturn } from '@heroui/react'
import { Modal } from '@heroui/react'
import { InfoIcon } from 'lucide-react'
import { useCallback, useTransition } from 'react'
import { logoutAction } from '@/modules/auth/auth.action'
import AppButton from '../app/AppButton'

export default function LogoutModal({
  isOpen,
  setOpen,
  close,
}: UseOverlayStateReturn) {
  const [_isPending, startTransition] = useTransition()

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      await logoutAction()
      close()
    })
  }, [close])

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={setOpen}
      isDismissable={!_isPending}
    >
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-90">
          <Modal.CloseTrigger isDisabled={_isPending} />
          <Modal.Header>
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <InfoIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading>
              退出登录
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p>
              确定退出登录吗？
            </p>
          </Modal.Body>
          <Modal.Footer>
            <AppButton
              variant="secondary"
              onClick={handleSignOut}
              isPending={_isPending}
            >
              确定
            </AppButton>
            <AppButton
              slot="close"
              isDisabled={_isPending}
            >
              取消
            </AppButton>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
