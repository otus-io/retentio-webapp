'use client'

import {
  Alert,
  Card,
  Description,
  FieldError,
  Form,
  Label,
  Modal,
  NumberField,
} from '@heroui/react'
import { CheckCircle2, Clock3, Globe2, MinusIcon, PlusIcon, Upload } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import { showSuccessToast } from '@/lib/ui'
import { publishDeckAction } from '@/modules/deck-sharing/deck-sharing.action'
import type { PublishDeckActionData } from '@/modules/deck-sharing/deck-sharing.schema'
import type { Deck } from '@/modules/decks/decks.schema'

interface DeckPublishPanelProps {
  deck: Deck
}

export default function DeckPublishPanel({ deck }: DeckPublishPanelProps) {
  const t = useTranslations('deck-sharing')
  const format = useFormatter()
  const [isOpen, setIsOpen] = useState(false)
  const isPublished = deck.published_version > 0
  const updatedAt = format.dateTime(new Date(deck.updated_at), {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <Card className="border-border/50" variant="default">
      <Card.Header>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 gap-3 items-center">
            <div className="mt-0.5 rounded-full bg-accent/10 p-2 text-accent">
              {isPublished
                ? <CheckCircle2 className="size-4" />
                : <Globe2 className="size-4" />}
            </div>
            <div className="min-w-0">
              <Card.Title>{isPublished ? t('public-title') : t('publish-title')}</Card.Title>
              <Card.Description className="mt-1">
                {isPublished ? t('public-description') : t('publish-description')}
              </Card.Description>
            </div>
          </div>
          <AppButton
            icon={<Upload className="size-4" />}
            onPress={() => setIsOpen(true)}
            variant={isPublished ? 'secondary' : 'primary'}
          >
            {isPublished ? t('republish') : t('publish')}
          </AppButton>
        </div>
      </Card.Header>
      {isPublished && (
        <Card.Content className="pt-0">
          <div className="flex text-foreground/80 flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4 text-sm">
            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('current-version-label')}</span>
              <span className="font-semibold tabular-nums text-foreground">
                v{deck.published_version}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('updated-at')}</span>
              <span className="font-medium text-foreground">{updatedAt}</span>
            </div>
          </div>
        </Card.Content>
      )}
      <PublishDeckModal
        key={Number(isOpen)}
        deckId={deck.id}
        currentVersion={deck.published_version}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </Card>
  )
}

interface PublishDeckModalProps {
  deckId: string
  currentVersion: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

function PublishDeckModal({
  deckId,
  currentVersion,
  isOpen,
  setIsOpen,
}: PublishDeckModalProps) {
  const t = useTranslations('deck-sharing')
  const isRepublish = currentVersion > 0
  const nextVersion = currentVersion + 1
  const defaultState: ActionState<PublishDeckActionData> = {
    data: isRepublish ? { version: nextVersion } : {},
  }
  const actionHandler = publishDeckAction.bind(null, { deckId, currentVersion })
  const [state, action, isPending] = useActionState(actionHandler, defaultState)

  useEffect(() => {
    if (!state?.success) return
    showSuccessToast(t('publish-success'))
    setIsOpen(false)
  }, [setIsOpen, state?.success, t])

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      shouldCloseOnInteractOutside={() => !isPending}
    >
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger isDisabled={isPending} />
          <Modal.Header>
            <Modal.Heading>{isRepublish ? t('republish-title') : t('publish-confirm-title')}</Modal.Heading>
          </Modal.Header>
          <Form action={action} validationErrors={state?.validationErrors}>
            <Modal.Body className="space-y-4 px-2 py-4">
              {isRepublish
                ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t('republish-description', { version: currentVersion })}
                    </p>
                    <NumberField
                      defaultValue={state?.data?.version ?? nextVersion}
                      formatOptions={{ useGrouping: false }}
                      isRequired
                      minValue={nextVersion}
                      name="version"
                      step={1}
                      variant="secondary"
                    >
                      <Label>{t('version-label')}</Label>
                      <NumberField.Group className="flex">
                        <NumberField.Input className="flex-1" />
                        <div className="flex h-full flex-col border-l border-field-placeholder/15">
                          <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pt-0.5 text-sm">
                            <PlusIcon className="size-4" />
                          </NumberField.IncrementButton>
                          <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pb-0.5 text-sm">
                            <MinusIcon className="size-4" />
                          </NumberField.DecrementButton>
                        </div>
                      </NumberField.Group>
                      <Description>{t('version-description', { version: currentVersion })}</Description>
                      <FieldError />
                    </NumberField>
                  </>
                )
                : (
                  <Alert status="warning" className="p-0! border-0! shadow-none">
                    <Alert.Content>
                      <Alert.Title>{t('irreversible-title')}</Alert.Title>
                      <Alert.Description className="text-sm">{t('irreversible-description')}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
              <AppError error={state?.error} />
            </Modal.Body>
            <Modal.Footer>
              <AppButton slot="close" variant="secondary" isDisabled={isPending}>
                {t('cancel')}
              </AppButton>
              <AppButton type="submit" isPending={isPending}>
                {isRepublish ? t('republish') : t('publish')}
              </AppButton>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
