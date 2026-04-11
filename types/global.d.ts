/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {

  interface ActionState<T = any> {
    /**
     * 操作是否成功
     */
    success?: boolean
    /**
     * 表单错误
     */
    validationErrors?: import('@react-types/shared').ValidationErrors
    /**
     * 服务错误
     */
    error?: Error | string | null
    /**
     * 返回数据
     */
    data?: T
  }

  type ActionFunction<T = any>
    = (state: ActionState<T> | null, formData: FormData) => ActionState<T> | Promise<ActionState<T> | null> | null

  type ActionFunctionPayload<T = any, U = any>
    = (payload: U, state: ActionState<T> | null, formData: FormData) => ActionState<T> | Promise<ActionState<T> | null>

  type KeyOfStringOrNumber<T> = {
    [K in keyof T]: T[K] extends string | number ? K : never
  }[keyof T]

  interface Pagination<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }

  type PaginationParams<T> = {
    pageSize?: number
    page?: number
    direction?: string
    column?: string
  } & Partial<T>

  type RequireKeys<
    T,
    K extends keyof T = never,
  > = Partial<T> & Required<Pick<T, K>>

  type EntityDTO<T> = {
    [K in keyof T]: T[K];
  }
}

export {}
