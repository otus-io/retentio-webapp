import { updateFactService } from '@/modules/facts/facts.service'
import { formatErrorMessage } from '@/utils/format'
import { NextResponse } from 'next/server'


export async function POST(request: Request, ctx: RouteContext<'/api/decks/[id]/facts/[factId]/update'>) {
  const { id, factId } = await ctx.params
  const body = await request.json()
  try {
    const { success, data } = await updateFactService(id, factId, body)
    if(!success){
      return NextResponse.json({ error: 'Failed to update deck fields' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: formatErrorMessage(error) }, { status: 500 })
  }
}
