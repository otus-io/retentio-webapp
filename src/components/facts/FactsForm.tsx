/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { Card, ErrorMessage, Form } from '@heroui/react'
import { FormEvent, startTransition, useActionState, useCallback, useMemo, useReducer, useState } from 'react'
import AppButton from '@/components/app/AppButton'
import AppError from '@/components/app/AppError'
import AppInput from '@/components/app/AppInput'
import { createFactsAction, updateFactAction } from '@/modules/facts/facts.action'
import { Entry, Fact } from '@/modules/facts/facts.schema'
import { Deck } from '@/modules/decks/decks.schema'
import { useTranslations } from 'next-intl'
import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'
import { Trash2, Plus, PaperclipIcon } from 'lucide-react'
import FactsMediaModal from '@/components/facts/FactsMediaModal'

type FactsFormProps =
  | { type: 'create'; deck: Deck; fact: null }
  | { type: 'update'; deck: Deck; fact: Fact }

interface PairItem extends Entry{
  id: string
  field: string
  text: string
}

function makePair(field = '', text = '', entry?: Partial<Entry>): PairItem {
  return { id: crypto.randomUUID(), field, text, ...entry }
}

type PairAction =
  | { type: 'ADD_PAIR' }
  | { type: 'REMOVE_PAIR'; id: string }
  | { type: 'UPDATE_FIELD'; id: string; field: string }
  | { type: 'UPDATE_TEXT'; id: string; text: string }
  | { type: 'UPDATE_MEDIA'; id: string; fileId: string; mediaType: 'audio' | 'image' | 'video' | undefined }

function pairReducer(state: PairItem[], action: PairAction): PairItem[] {
  switch (action.type) {
    case 'ADD_PAIR':
      return [...state, makePair(`field${state.length + 1}`)]
    case 'REMOVE_PAIR':
      if (state.length <= 2) return state
      return state.filter((p) => p.id !== action.id)
    case 'UPDATE_FIELD':
      return state.map((p) => (p.id === action.id ? { ...p, field: action.field } : p))
    case 'UPDATE_TEXT':
      return state.map((p) => (p.id === action.id ? { ...p, text: action.text } : p))
    case 'UPDATE_MEDIA':
      return state.map((p) => (p.id === action.id ? { ...p, [action.mediaType!]: action.fileId } : p))
    default:
      return state
  }
}

export default function FactsForm({ type, deck, fact }: FactsFormProps) {
  const actionHandler =
    type === 'create'
      ? createFactsAction.bind(null, deck.id)
      : updateFactAction.bind(null, { deckId: deck.id, factId: fact.id })


  const [state, action, isPending] = useActionState(actionHandler, {
    data: type === 'create'? undefined : { facts: [fact] },
  })


  return (
    <FactsFormInner
      key={state?.data?.submissionId}
      state={state}
      action={action}
      isPending={isPending}
      type={type}
      deck={deck}
    />
  )
}

function FactsFormInner({
  type,
  deck,
  state,
  isPending,
  action,
}: {
  action: (payload: FormData) => void
  state: ActionState<any> | null
  isPending: boolean
  type: FactsFormProps['type']
  deck: Deck
}) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [currentPairId, setCurrentPairId] = useState<string>()
  const [pairs, dispatch] = useReducer(pairReducer, null, () => {
    const facts = state?.data?.facts as Fact[]
    if (facts?.length) {
      const fact = facts[0]
      const fields = fact.fields ?? deck.fields ?? []
      return fields.map((field, i) => makePair(field, fact.entries[i]?.text ?? '', fact.entries[i]))
    }
    const source = deck.fields?.length >= 2 ? deck.fields : ['', '']
    return source.map((field) => makePair(field))
  })

  const entry = useMemo(() => {
    return pairs.find((p) => p.id === currentPairId)
  }, [pairs, currentPairId])


  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>)=> {
    event.preventDefault()
    startTransition(()=>{
      const facts = [{
        fields: pairs.map((p) => p.field),
        entries: pairs.map((p) => ({ text: p.text, audio: p.audio, image: p.image, video: p.video })),
      }]
      const out = new FormData()
      out.append('facts', JSON.stringify(facts))
      if(type === 'create'){
        out.append('operation', 'prepend')
      }
      action(out)
    })
  }, [action, pairs, type])



  const handleOpen = (pairId: string) => {
    setIsOpen(true)
    setCurrentPairId(pairId)
  }

  const handleUpload = (fileId: string, mediaType: 'audio' | 'image' | 'video' | undefined) => {
    if (currentPairId)
      dispatch({ type: 'UPDATE_MEDIA', id: currentPairId, fileId, mediaType })
  }


  const filedError = useMemo(() => {
    const e = state?.validationErrors
    if(e && e.facts && e.facts.length){
      return e.facts[0]
    }
    return undefined
  }, [state?.validationErrors])

  return (
    <div className="mx-auto grid w-full max-w-content items-start gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <AppBreadcrumbs
        items={[
          { href: '/decks', title: t('nav.decks') },
          { href: `/decks/${deck.id}`, title: deck.name },
          { href: `/decks/${deck.id}/facts`, title: '词组' },
          { href: '', title: type === 'create' ? '新增词组' : '编辑词组' },
        ]}
      />

      <div className="max-w-lg w-full mx-auto space-y-4">
        <Card>
          <Card.Header>
            <Card.Title>{type === 'create' ? '新增词组' : '编辑词组'}</Card.Title>
          </Card.Header>

          <Form validationErrors={state?.validationErrors} onSubmit={handleSubmit}>
            <Card.Content className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-2 items-center px-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Field
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Entry
                </span>
                <span className="w-8" />
                <span className="w-8" />
              </div>

              <div className="space-y-1.5">
                {pairs.map((pair) => (
                  <div key={pair.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-x-2 items-center">
                    <AppInput
                      aria-label="field"
                      variant="secondary"
                      value={pair.field}
                      onChange={(e) => dispatch({ type: 'UPDATE_FIELD', id: pair.id, field: e })}
                    />
                    <div className="space-y-1">
                      <AppInput
                        aria-label="entry"
                        variant="secondary"
                        value={pair.text}
                        onChange={(e) => dispatch({ type: 'UPDATE_TEXT', id: pair.id, text: e })}
                      />
                    </div>
                    <AppButton
                      variant="danger-soft"
                      size="sm"
                      isDisabled={pairs.length <= 2}
                      onClick={() => dispatch({ type: 'REMOVE_PAIR', id: pair.id })}
                      aria-label="remove"
                    >
                      <Trash2 className="size-3.5" />
                    </AppButton>
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(pair.id)}
                      aria-label="remove"
                    >
                      <PaperclipIcon className="size-3.5" />
                    </AppButton>
                  </div>
                ))}
              </div>

              <AppButton variant="secondary" onClick={() => dispatch({ type: 'ADD_PAIR' })} className="w-full">
                <Plus className="size-4 mr-1" />
              </AppButton>

              {
                filedError && (
                  <ErrorMessage>
                    {filedError}
                  </ErrorMessage>
                )}
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

      <FactsMediaModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        entry={entry}
        id={currentPairId}
        onUpload={handleUpload}
      />
    </div>
  )
}
