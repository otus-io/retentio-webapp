import { describe, expect, it, vi } from 'vitest'
import * as api from '@/api/deck-sharing'
import { getPublishPreviewService } from '@/modules/deck-sharing/deck-sharing.service'
import { RequestError } from '@/utils/request'

vi.mock('@/api/deck-sharing', () => ({ getPublishPreview: vi.fn() }))

describe('getPublishPreviewService', () => {
  it('wraps success and failure', async () => {
    vi.mocked(api.getPublishPreview).mockResolvedValueOnce({ data: { has_unpublished_changes: true }, meta: { msg: 'ok' } } as never)
    expect(await getPublishPreviewService('d1')).toMatchObject({ success: true, data: { has_unpublished_changes: true } })
    vi.mocked(api.getPublishPreview).mockRejectedValueOnce(new RequestError('Not authorized', 403))
    expect(await getPublishPreviewService('d1')).toMatchObject({ success: false, status: 403 })
  })
})
