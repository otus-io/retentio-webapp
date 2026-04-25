// import type { IFormItemItems } from '@/components/schema/SchemaForm'

export function urlSearchParamsToObject(params: URLSearchParams) {
  const obj: Record<string, string | string[]> = {}
  for (const [k, v] of params) {
    obj[k] = k in obj
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ([] as string[]).concat(obj[k] as any, v)
      : v
  }
  return obj
}

export function formatErrorMessage(error: unknown, defaultError: string = ''): string {
  if (error instanceof AggregateError) {
    return error.errors.map((err) => {
      if (err instanceof Error) {
        return err.message
      }
      return JSON.stringify(err)
    }).join('; ')
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  const errorMessageKeys = ['message', 'msg']
  for (const key of errorMessageKeys) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (key in (error as any) && typeof (error as any)[key] === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (error as any)[key]
    }
  }
  if (defaultError) {
    return defaultError
  }
  const msg = JSON.stringify(error) || '未知错误'
  return msg
}

export function formDataToObject(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {}
  for (const [key, value] of formData.entries()) {
    if (key in obj) {
      obj[key] = Array.isArray(obj[key])
        ? [...obj[key], value]
        : [obj[key], value]
    }
    else {
      obj[key] = value
    }
  }
  return obj
}

// export function getLabelByValue(labels: IFormItemItems, value: number | string) {
//   return labels.find(item => item.value === value)?.label || ''
// }
