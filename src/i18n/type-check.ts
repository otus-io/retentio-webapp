type DeepKeys<T> = T extends object
  ? {
    [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${DeepKeys<T[K]>}`
        : K
      : never
  }[keyof T]
  : never

type IsEqual<T, U> =
  [T] extends [U] ? ([U] extends [T] ? true : false) : false


// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ZhKeysDeep = DeepKeys<typeof import('./locales/zh-CN.json')>

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type EnKeysDeep = DeepKeys<typeof import('./locales/en.json')>

type KeysMatchDeep = IsEqual<ZhKeysDeep, EnKeysDeep>
type AssertKeysMatch<T extends true> = T

// ts 静态检查
export type isLocalesKeyCheckPass = AssertKeysMatch<KeysMatchDeep>
