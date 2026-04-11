import { toast } from '@heroui/react'
import { formatErrorMessage } from '@/utils/format'

export function showSuccessToast(message: string) {
  return toast.success(message)
}

export function showFailToast(message: string | Error | unknown) {
  return toast.danger(formatErrorMessage(message))
}

export function showWarningToast(message: string) {
  return toast.warning(message)
}

export function showInfoToast(message: string) {
  return toast(message)
}
