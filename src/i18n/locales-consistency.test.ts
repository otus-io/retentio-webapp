import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import zh from './locales/zh.json'

function deepKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...deepKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

describe('i18n locale key consistency', () => {
  const enKeys = new Set(deepKeys(en))
  const zhKeys = new Set(deepKeys(zh))

  it('两个 locale 的 key 路径完全一致', () => {
    const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k)).sort()
    const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k)).sort()

    const diffs: string[] = []
    if (onlyInEn.length > 0) {
      diffs.push(`仅在 en.json 中存在: ${onlyInEn.join(', ')}`)
    }
    if (onlyInZh.length > 0) {
      diffs.push(`仅在 zh.json 中存在: ${onlyInZh.join(', ')}`)
    }

    expect(diffs).toEqual([])
  })

  it('两个 locale 的顶层 key 数量相同', () => {
    expect(Object.keys(en).length).toBe(Object.keys(zh).length)
  })

  it('两个 locale 的叶子节点数量相同', () => {
    expect(enKeys.size).toBe(zhKeys.size)
  })
})
