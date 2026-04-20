'use server'
import DecksDetail from '@/components/decks/DecksDetail'
import { getDeckService } from '@/modules/decks/decks.service'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  return (
    <div className="mx-auto max-w-content py-2 grid grid-cols-[auto_1fr]">
      <DecksDetail deck={data.data} />
    </div>
  )
}
