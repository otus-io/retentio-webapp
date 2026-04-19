import DecksForm from '@/components/decks/DecksForm'
import { getDeckService } from '@/modules/decks/decks.service'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]/edit'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  console.log(data.data)
  return <DecksForm type="update" data={data.data} />
}
