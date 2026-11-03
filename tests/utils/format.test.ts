import { describe, expect, it } from 'vitest'
import { formatErrorMessage, formDataToObject, urlSearchParamsToObject } from '@/utils/format'

describe('urlSearchParamsToObject', () => {
  it('将单值参数转为字符串', () => {
    const params = new URLSearchParams('?name=zhangsan&age=18')
    expect(urlSearchParamsToObject(params)).toEqual({ name: 'zhangsan', age: '18' })
  })

  it('将重复 key 转为数组', () => {
    const params = new URLSearchParams('?tag=a&tag=b&tag=c')
    expect(urlSearchParamsToObject(params)).toEqual({ tag: ['a', 'b', 'c'] })
  })

  it('处理空参数', () => {
    const params = new URLSearchParams('')
    expect(urlSearchParamsToObject(params)).toEqual({})
  })
})

describe('formatErrorMessage', () => {
  it('提取 Error.message', () => {
    expect(formatErrorMessage(new Error('网络错误'))).toBe('网络错误')
  })

  it('提取 AggregateError 中所有错误', () => {
    const err = new AggregateError([new Error('err1'), new Error('err2')], 'aggregate')
    expect(formatErrorMessage(err)).toBe('err1; err2')
  })

  it('直接返回字符串类型错误', () => {
    expect(formatErrorMessage('请求失败')).toBe('请求失败')
  })

  it('从对象的 message 字段提取', () => {
    expect(formatErrorMessage({ message: '自定义错误' })).toBe('自定义错误')
  })

  it('从对象的 msg 字段提取', () => {
    expect(formatErrorMessage({ msg: '操作异常' })).toBe('操作异常')
  })

  it('未知错误返回 JSON 字符串', () => {
    expect(formatErrorMessage({ code: 500 })).toBe('{"code":500}')
  })

  it('优先使用提供的 defaultError', () => {
    expect(formatErrorMessage(null, '默认错误信息')).toBe('默认错误信息')
  })

  it('AggregateError 中的非 Error 项序列化为 JSON', () => {
    const err = new AggregateError([new Error('err1'), { code: 2 }], 'aggregate')
    expect(formatErrorMessage(err)).toBe('err1; {"code":2}')
  })

  it('null 且未提供 defaultError 时返回 JSON null', () => {
    expect(formatErrorMessage(null)).toBe('null')
  })

  it('undefined 且未提供 defaultError 时返回未知错误', () => {
    expect(formatErrorMessage(undefined)).toBe('未知错误')
  })

  it('message 与 msg 不是字符串时使用 defaultError', () => {
    expect(formatErrorMessage({ message: 12, msg: { text: 'nope' } }, '默认错误信息')).toBe('默认错误信息')
  })

  it('无法 JSON 序列化时返回未知错误', () => {
    expect(formatErrorMessage(() => 'hidden')).toBe('未知错误')
  })
})

describe('formDataToObject', () => {
  it('将单值字段转为字符串', () => {
    const fd = new FormData()
    fd.append('username', 'admin')
    fd.append('password', '123456')
    expect(formDataToObject(fd)).toEqual({ username: 'admin', password: '123456' })
  })

  it('将重复字段转为数组', () => {
    const fd = new FormData()
    fd.append('role', 'admin')
    fd.append('role', 'user')
    expect(formDataToObject(fd)).toEqual({ role: ['admin', 'user'] })
  })

  it('处理空 FormData', () => {
    const fd = new FormData()
    expect(formDataToObject(fd)).toEqual({})
  })

  it('将三个及以上重复字段追加到同一数组', () => {
    const fd = new FormData()
    fd.append('role', 'admin')
    fd.append('role', 'user')
    fd.append('role', 'guest')
    expect(formDataToObject(fd)).toEqual({ role: ['admin', 'user', 'guest'] })
  })
})
