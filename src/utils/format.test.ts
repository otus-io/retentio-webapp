import { describe, expect, it } from 'vitest'
import { formatErrorMessage, formDataToObject, urlSearchParamsToObject } from './format'

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
})
