import { describe, expect, it } from 'vitest'
import { normalizePath } from './string'

describe('normalizePath', () => {
  it('根路径 / 保持不变', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('去掉末尾 /index', () => {
    expect(normalizePath('/about/index')).toBe('/about')
  })

  it('去掉末尾 /', () => {
    expect(normalizePath('/about/')).toBe('/about')
  })

  it('同时有 /index 和末尾 / 时最终去掉 /index', () => {
    expect(normalizePath('/about/index/')).toBe('/about')
  })

  it('普通路径不变', () => {
    expect(normalizePath('/about')).toBe('/about')
  })

  it('多层路径去掉末尾 /', () => {
    expect(normalizePath('/a/b/c/')).toBe('/a/b/c')
  })
})
