'use client'

import { deleteDeckAction } from '@/modules/decks/decks.action'
import { AlertDialog, Button, UseOverlayStateReturn } from '@heroui/react'
import { useActionState, useEffect } from 'react'


interface DecksDeleteModalProps extends UseOverlayStateReturn{
  deckId: string
}

export default function DecksDeleteModal({
  deckId,
  ...state
}: DecksDeleteModalProps) {
  const deleteDeck = deleteDeckAction.bind(null, deckId)
  const [_state, action, isPending] = useActionState(deleteDeck, null)
  useEffect(()=>{
    if(_state?.success){
      state.setOpen(false)
    }
  }, [_state?.success, state])
  return (
    <AlertDialog.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-100">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>提示</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              确认删除吗？删除后将无法恢复，请谨慎操作。
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <form action={action}>
              <Button slot="close" isPending={isPending} variant="danger" type="submit">
                确认删除
              </Button>
            </form>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}

