import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en.json'
import zh from '@/i18n/locales/zh.json'
import ja from '@/i18n/locales/ja.json'

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
  const locales = { en, zh, ja } as const
  const keysByLocale = Object.fromEntries(
    Object.entries(locales).map(([name, messages]) => [name, new Set(deepKeys(messages))]),
  ) as Record<keyof typeof locales, Set<string>>

  const reference = keysByLocale.en

  it('すべての locale の key パスが完全に一致する', () => {
    const diffs: string[] = []
    for (const [name, keys] of Object.entries(keysByLocale)) {
      if (name === 'en') continue
      const onlyInEn = [...reference].filter((k) => !keys.has(k)).sort()
      const onlyInLocale = [...keys].filter((k) => !reference.has(k)).sort()
      if (onlyInEn.length > 0) {
        diffs.push(`en にあって ${name} にない: ${onlyInEn.join(', ')}`)
      }
      if (onlyInLocale.length > 0) {
        diffs.push(`${name} にあって en にない: ${onlyInLocale.join(', ')}`)
      }
    }
    expect(diffs).toEqual([])
  })

  it('すべての locale の頂層 key 数量が同じ', () => {
    for (const messages of Object.values(locales)) {
      expect(Object.keys(messages).length).toBe(Object.keys(en).length)
    }
  })

  it('すべての locale の葉子ノード数量が同じ', () => {
    for (const keys of Object.values(keysByLocale)) {
      expect(keys.size).toBe(reference.size)
    }
  })
})
