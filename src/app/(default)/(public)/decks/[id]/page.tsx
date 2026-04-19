import AppLink from '@/components/app/AppLink'
import { getDeckService } from '@/modules/decks/decks.service'
import { notFound } from 'next/navigation'

export default async function Page(props: PageProps<'/decks/[id]'>) {
  const id = (await props.params).id
  const data = await getDeckService(id)
  if(!data.success){
    notFound()
  }
  return (
    <div className="mx-auto max-w-content">
      <AppLink href={`/decks/${id}/edit`}>
        edit
      </AppLink>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  )
}
