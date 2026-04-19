'use client'

import { Card, Form, Label, NumberField } from '@heroui/react'
import { useActionState, useMemo, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createDeckAction, updateDeckAction } from '@/modules/decks/decks.action'
import { Deck } from '@/modules/decks/decks.schema'


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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const actionHandler = useMemo(()=>{
    if(type === 'create'){
      return createDeckAction
    }
    return updateDeckAction.bind(null, data.id)
  }, [data?.id, type])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const defaultState = useMemo(()=>{
    if(type === 'update'){
      return {
        data: {
          name: data.name,
          fields: data.field,
          rate: data.rate,
          submissionId: '',
        },
      }
    }else {
      return {
        data: {
          name: '',
          fields: ['', ''],
          rate: '',
          submissionId: '',
        },
      }
    }
  }, [data?.field, data?.name, data?.rate, type])


  const [state, action, isPending] = useActionState(actionHandler, defaultState)
  console.log({ state })

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: ActionState<any> | null,
  action: (payload: FormData) => void,
  isPending: boolean,
  type: DecksCreateFormProps['type']
}) {
  const [fields, setFields] = useState<{ name: string, id: string }[]>(() => {
    if (state?.data?.fields && Array.isArray(state.data.fields) && state.data.fields.length >= 2) {
      return state.data.fields.map((f: string) => ({ name: f, id: crypto.randomUUID() }))
    }
    return Array.from({ length: 2 }).map(() => ({ name: '', id: crypto.randomUUID() }))
  })

  console.log(fields)

  function addField() {
    setFields((prev) => [...prev, { name: '', id: crypto.randomUUID() }])
  }

  return (
    <div
      className="flex-1 sm:min-h-[calc(100vh-270px)] pt-8 max-w-content w-full px-2 sm:px-4 md:px-6 mx-auto box-border space-y-2"
    >
      <div className="max-w-lg mx-auto space-y-4 py-8 px-2 sm:p-0">
        <Card>
          <Card.Header>
            <Card.Title> {type==='create'?' Create Your Deck':'Update Your Deck'}</Card.Title>
          </Card.Header>
          <Form
            action={action}
            validationErrors={state?.validationErrors}
          >
            <Card.Content>
              <AppInput
                label={'decks.name'}
                name="name"
                isRequired
                placeholder={'decks.name-placeholder'}
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
                      placeholder={`Enter field ${index + 1}`}
                      variant="secondary"
                      className={'flex-1'}
                      defaultValue={field.name}
                    />
                    <div className={clsx(index===0&&'pt-6')}>
                      <AppButton
                        variant="danger-soft"
                        isDisabled={fields.length <= 2}
                        onClick={() => {
                          setFields((prev) => prev.filter((f) => f.id !== field.id))
                        }}
                      >
                        remove
                      </AppButton>
                    </div>
                  </div>
                ))
              }

              <AppButton
                variant="secondary"
                onClick={addField}
              >
                add field
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
                <Label>Rate (1–1000)</Label>
                <NumberField.Group
                  className={'grid-cols-[1fr_auto]'}
                >
                  <NumberField.Input
                    placeholder="please enter rate"
                  />
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
                submit
              </AppButton>
            </Card.Footer>
          </Form>
        </Card>
        <AppError error={state?.error} />
      </div>
    </div>
  )
}
