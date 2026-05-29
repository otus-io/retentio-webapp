'use client'

import { Modal, Form } from '@heroui/react'
import { useActionState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import AppInput from '@/components/app/AppInput'
import AppTextarea from '@/components/app/AppTextarea'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import type { Tag } from '@/modules/tags/tags.schema'
import { createTagAction, updateTagAction } from '@/modules/tags/tags.action'

interface TagFormModalProps {
  isOpen: boolean
  tag: Tag | null
  setIsOpen: (v: boolean) => void
  /**
   * 创建/更新成功后的回调。
   * 提供时不再触发 `router.refresh()`，而是把保存后的标签交给调用方处理（例如回显到选择器）。
   */
  onSuccess?: (tag: Tag) => void
}

export default function TagFormModal({
  isOpen,
  tag,
  setIsOpen,
  onSuccess,
}: TagFormModalProps) {
  return (
    <TagFormModalInner
      key={tag?.id ?? 'create'}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      tag={tag}
      onSuccess={onSuccess}
    />
  )
}

function TagFormModalInner({ isOpen, setIsOpen, tag, onSuccess }: TagFormModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const pendingClose = useRef(false)

  const title = tag
    ? t('common.update', { name: t('term.tags') })
    : t('common.create', { name: t('term.tags') })

  const actionHandler = tag
    ? updateTagAction.bind(null, tag.id)
    : createTagAction

  const defaultState = {
    data: {
      name: tag?.name ?? '',
      description: tag?.description ?? '',
    },
  }

  const [state, action, isPending] = useActionState(actionHandler, defaultState)

  const loading = isPending || isRefreshing

  useEffect(() => {
    if (!state?.success) return
    if (onSuccess) {
      onSuccess(state.data as Tag)
      setIsOpen(false)
      return
    }
    pendingClose.current = true
    startTransition(() => {
      setIsOpen(false)
      router.refresh()
    })
  }, [state?.success, state?.data, onSuccess, router, setIsOpen])




  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      shouldCloseOnInteractOutside={() => !loading}
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger isDisabled={loading} />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Form action={action} validationErrors={state?.validationErrors}>
            <Modal.Body className="space-y-2 px-2 py-4">
              <AppInput
                name="name"
                label={t('term.name')}
                placeholder={t('common.placeholder-enter', { name: t('term.name') })}
                isRequired
                variant="secondary"
                defaultValue={state?.data?.name}
                autoFocus
              />
              <AppTextarea
                name="description"
                label={t('term.description')}
                placeholder={t('common.placeholder-enter', { name: t('term.description') })}
                variant="secondary"
                defaultValue={state?.data?.description}
              />
              <AppError error={state?.error} />
            </Modal.Body>
            <Modal.Footer>
              <AppButton slot="close" variant="secondary" isDisabled={loading}>
                {t('common.cancel')}
              </AppButton>
              <AppButton type="submit" isPending={loading}>
                {t('common.save')}
              </AppButton>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
