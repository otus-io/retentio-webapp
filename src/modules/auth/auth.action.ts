'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import z from 'zod'
import { LOGIN_PATH } from '@/config'
import { formDataToObject } from '@/utils/format'
import {
  PASSWORDS_MISMATCH,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema'
import {
  forgotPasswordService,
  loginService,
  registerService,
  logoutService,
  resetPasswordService,
  verifyEmailService,
} from './auth.service'

async function localizeAuthFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Promise<Record<string, string[] | undefined>> {
  const t = await getTranslations('auth')
  const out: Record<string, string[] | undefined> = { ...fieldErrors }
  for (const [key, messages] of Object.entries(out)) {
    if (!messages) continue
    out[key] = messages.map((msg) =>
      msg === PASSWORDS_MISMATCH ? t('passwordsMismatch') : msg)
  }
  return out
}

export const loginAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data,
    }
  }
  const res = await loginService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath('/')
  redirect(result.data.redirect || '/')
}

export const registerAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = registerSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data,
    }
  }
  const res = await registerService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  revalidatePath('/')
  redirect(result.data.redirect || '/')
}

export const forgotPasswordAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = forgotPasswordSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await forgotPasswordService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  return {
    data,
    success: true,
  }
}

export const resetPasswordAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = resetPasswordSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data,
    }
  }
  const res = await resetPasswordService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data,
      success: false,
    }
  }
  redirect(LOGIN_PATH)
}

export async function verifyEmailAction(token: string) {
  const t = await getTranslations('auth')
  const result = verifyEmailSchema.safeParse({ token })
  if (!result.success) {
    return {
      error: t('verifyEmailMissingToken'),
      success: false as const,
    }
  }
  const res = await verifyEmailService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      success: false as const,
    }
  }
  return { success: true as const }
}

export async function logoutAction() {
  await logoutService()
  revalidatePath('/')
  redirect('/')
}
