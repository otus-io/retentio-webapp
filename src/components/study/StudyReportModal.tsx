'use client'

import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppSelect from '@/components/app/AppSelect'
import AppTextarea from '@/components/app/AppTextarea'
import { submitReportContributionAction } from '@/modules/contributions/contributions.action'
import { Modal } from '@heroui/react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

type ReportKind = 'audio' | 'content' | 'other'

interface StudyReportModalProps {
  importDeckId: string
  factId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onSuccess: () => void
}

/** Importer report for the current fact (message-only contribution). */
export default function StudyReportModal({ importDeckId, factId, isOpen, setIsOpen, onSuccess }: StudyReportModalProps) {
  const t = useTranslations('study')
  const tCommon = useTranslations('common')
  const [kind, setKind] = useState<ReportKind>('audio')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const kindLabel = (k: ReportKind) => t(`report-kind-${k}`)

  const handleSubmit = () => {
    const trimmed = details.trim()
    if (kind === 'other' && !trimmed) {
      setError(t('report-details-required'))
      return
    }
    const message = kind === 'other' ? trimmed : trimmed ? `${kindLabel(kind)}: ${trimmed}` : kindLabel(kind)
    startTransition(async () => {
      const res = await submitReportContributionAction({ importDeckId, factId, data: { message } }, null, new FormData())
      if (!res?.success) {
        setError(String(res?.error ?? ''))
        return
      }
      setIsOpen(false)
      setDetails('')
      setError(null)
      onSuccess()
    })
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t('report-issue')}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4 px-1 py-2">
            <AppSelect
              className="w-full"
              label={t('report-kind')}
              items={(['audio', 'content', 'other'] as const).map((k) => ({ id: k, name: kindLabel(k) }))}
              value={kind}
              onChange={(key) => setKind((key ?? 'audio') as ReportKind)}
            />
            <AppTextarea
              label={t('report-details')}
              placeholder={kind === 'other' ? t('report-other-hint') : t('report-details-hint')}
              value={details}
              onChange={setDetails}
            />
            <AppError error={error} />
          </Modal.Body>
          <Modal.Footer>
            <AppButton slot="close" variant="secondary" isDisabled={isPending}>{tCommon('cancel')}</AppButton>
            <AppButton isPending={isPending} onPress={handleSubmit}>{tCommon('submit')}</AppButton>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
