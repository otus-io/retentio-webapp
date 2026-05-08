'use client'

import { Card, Form, Label, NumberField } from '@heroui/react'
import { useActionState, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createDeckAction, updateDeckAction } from '@/modules/decks/decks.action'
import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'


type DecksCreateFormProps = {
  type: 'create',
  data: null
}|{
  type: 'update',
  data: Deck
}

export default function DecksForm({
  type,
  data,
}: DecksCreateFormProps) {

  const defaultState = type === 'update'
    ? {
      data: {
        name: data.name,
        fields: data.fields,
        rate: data.rate,
        submissionId: '',
      },
    }
    : {
      data: {
        name: '',
        fields: ['', ''],
        rate: '20',
        submissionId: '',
      },
    }

  const actionHandler = type === 'create'
    ?createDeckAction
    : updateDeckAction.bind(null, data.id)

  const [state, action, isPending] = useActionState(actionHandler, defaultState)

  return (
    <DecksFormInner
      key={state?.data.submissionId}
      state={state}
      action={action}
      isPending={isPending}
      type={type}
    />
  )
}

function DecksFormInner({
  type,
  state,
  action,
  isPending,
}: {

  state: ActionState<any> | null,
  action: (payload: FormData) => void,
  isPending: boolean,
  type: DecksCreateFormProps['type']
}) {

  const t = useTranslations()

  const [fields, setFields] = useState<{ name: string, id: string }[]>(() => {
    if (state?.data?.fields && Array.isArray(state.data.fields) && state.data.fields.length >= 2) {
      return state.data.fields.map((f: string) => ({ name: f, id: crypto.randomUUID() }))
    }
    return Array.from({ length: 2 }).map(() => ({ name: '', id: crypto.randomUUID() }))
  })

  function addField() {
    setFields((prev) => [...prev, { name: '', id: crypto.randomUUID() }])
  }

  const title = type === 'create' ? t('common.create', { name: t('term.decks') }) : t('common.update', { name: t('term.decks') })

  return (
    <div
      className="mx-auto grid w-full max-w-content items-start gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:px-10"
    >

      <AppBreadcrumbs
        items={[
          { href: '/decks', title: t('term.decks') },
          { title: title, href: '' },
        ]}
      />

      <div className="max-w-lg w-full mx-auto space-y-4">
        <Card>
          <Card.Header>
            <Card.Title>{title}</Card.Title>
          </Card.Header>
          <Form
            action={action}
            validationErrors={state?.validationErrors}
          >
            <Card.Content>
              <AppInput
                label={t('term.name')}
                name="name"
                placeholder={t('common.placeholder-enter', { name: t('term.name') })}
                isRequired
                variant="secondary"
                defaultValue={state?.data?.name}
              />
              {
                fields.map((field, index) => (
                  <div key={field.id} className="flex items-start justify-start gap-2">
                    <AppInput
                      label={index===0 && 'Field One box per field (at least 2).'}
                      name="fields"
                      aria-label="filed"
                      isRequired
                      variant="secondary"
                      className={'flex-1'}
                      defaultValue={field.name}
                      placeholder={t('common.placeholder-enter', { name: t('term.fields') })}

                    />
                    <div className={clsx(index===0&&'pt-6')}>
                      <AppButton
                        variant="danger-soft"
                        isDisabled={fields.length <= 2}
                        onClick={() => {
                          setFields((prev) => prev.filter((f) => f.id !== field.id))
                        }}
                      >
                        {t('common.remove')}
                      </AppButton>
                    </div>
                  </div>
                ))
              }

              <AppButton
                variant="secondary"
                onClick={addField}
              >
                {t('common.add', { name: t('term.fields') })}
              </AppButton>
              <NumberField
                formatOptions={{
                  useGrouping: false,
                }}
                maxValue={1000}
                defaultValue={state?.data?.rate}
                minValue={1}
                name="rate"
                variant="secondary"
                isRequired
              >
                <Label>{t('term.rate')} (1–1000)</Label>
                <NumberField.Group
                  className={'grid-cols-[1fr_auto]'}
                >
                  <NumberField.Input />
                  <div className="flex h-[calc(100%+2px)] flex-col border-l border-field-placeholder/15">
                    <NumberField.IncrementButton className="-ml-px flex h-1/2 w-6 flex-1 rounded-none border-r-0 border-l-0 pt-0.5 text-sm">
                      <ChevronUp className="size-3" />
                    </NumberField.IncrementButton>
                    <NumberField.DecrementButton className="-ml-px flex h-1/2 w-6 flex-1 rounded-none border-r-0 border-l-0 pb-0.5 text-sm">
                      <ChevronDown className="size-3" />
                    </NumberField.DecrementButton>
                  </div>
                </NumberField.Group>
              </NumberField>
            </Card.Content>
            <Card.Footer className="mt-4">
              <AppButton
                isPending={isPending}
                className="w-full"
                type="submit"
                size="lg"
              >
                {t('common.submit')}
              </AppButton>
            </Card.Footer>
          </Form>
        </Card>
        <AppError error={state?.error} />
      </div>
    </div>
  )
}
