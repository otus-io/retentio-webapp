'use client'

import { deleteDeckAction } from '@/modules/decks/decks.action'
import { AlertDialog, Button, UseOverlayStateReturn } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect } from 'react'


interface DecksDeleteModalProps extends UseOverlayStateReturn{
  deckId: string
}

export default function DecksDeleteModal({
  deckId,
  ...state
}: DecksDeleteModalProps) {
  const t = useTranslations()
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
            <AlertDialog.Heading>{t('common.tips')}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              {t('common.delete-confirm')}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              {t('common.cancel')}
            </Button>
            <form action={action}>
              <Button slot="close" isPending={isPending} variant="danger" type="submit">
                {t('common.confirm')}
              </Button>
            </form>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}

