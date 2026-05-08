import { updateDeckService } from '@/modules/decks/decks.service'
import { formatErrorMessage } from '@/utils/format'
import { NextResponse } from 'next/server'


export async function POST(request: Request, ctx: RouteContext<'/api/decks/[id]/fields'>) {
  const { id } = await ctx.params
  const body = await request.json()
  try {
    const { success } = await updateDeckService(id, body)
    if(!success){
      return NextResponse.json({ error: 'Failed to update deck fields' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: formatErrorMessage(error) }, { status: 500 })
  }
}
