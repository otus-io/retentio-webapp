import { describe, expect, it } from 'vitest'
import { ServiceResponse } from '@/lib/response'
import { RequestError } from '@/utils/request'

describe('ServiceResponse', () => {
  it('wraps a successful API result', () => {
    expect(ServiceResponse.success({
      data: { id: 'deck-1' },
      meta: { msg: 'ok' },
    })).toEqual({
      success: true,
      data: { id: 'deck-1' },
      message: null,
      status: null,
      meta: { msg: 'ok' },
    })
  })

  it('uses the given message when no cause is provided', () => {
    expect(ServiceResponse.error('token not found')).toEqual({
      success: false,
      data: null,
      message: 'token not found',
      status: null,
      meta: { msg: 'token not found' },
    })
  })

  it('formats a generic error and leaves status null', () => {
    expect(ServiceResponse.error('loginFailed failed', new Error('bad creds'))).toEqual({
      success: false,
      data: null,
      message: 'bad creds',
      status: null,
      meta: { msg: 'loginFailed failed' },
    })
  })

  it('exposes the HTTP status of a RequestError', () => {
    expect(ServiceResponse.error('loginFailed failed', new RequestError('用户不存在', 404))).toEqual({
      success: false,
      data: null,
      message: '用户不存在',
      status: 404,
      meta: { msg: 'loginFailed failed' },
    })
  })
})
