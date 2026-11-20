'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import z from 'zod'
import { LOGIN_PATH } from '@/config'
import { formDataToObject } from '@/utils/format'
import {
  EMAIL_INVALID,
  PASSWORD_REQUIRED,
  PASSWORD_SPACES,
  PASSWORD_TOO_LONG,
  PASSWORD_TOO_MANY_BYTES,
  PASSWORD_TOO_SHORT,
  PASSWORDS_MISMATCH,
  USERNAME_INVALID,
  USERNAME_LENGTH,
  USERNAME_SPACES,
  changeEmailSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema'
import {
  changeEmailService,
  deleteAccountService,
  forgotPasswordService,
  loginService,
  registerService,
  logoutService,
  resendVerificationService,
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
    out[key] = messages.map((msg) => {
      if (msg === PASSWORDS_MISMATCH) return t('passwordsMismatch')
      if (msg === USERNAME_INVALID) return t('usernameInvalid')
      if (msg === USERNAME_LENGTH) return t('usernameLength')
      if (msg === USERNAME_SPACES) return t('usernameSpaces')
      if (msg === PASSWORD_SPACES) return t('passwordSpaces')
      if (msg === PASSWORD_TOO_SHORT) return t('passwordTooShort')
      if (msg === PASSWORD_TOO_LONG) return t('passwordTooLong')
      if (msg === PASSWORD_TOO_MANY_BYTES) return t('passwordTooManyBytes')
      if (msg === EMAIL_INVALID) return t('emailInvalid')
      if (msg === PASSWORD_REQUIRED) return t('passwordRequired')
      return msg
    })
  }
  return out
}

function resetPasswordSafeData(data: Record<string, unknown>) {
  return {
    token: typeof data.token === 'string' ? data.token : '',
  }
}

/** Keep non-secret fields for form repopulation; never echo passwords. */
function authFormSafeData<T extends { password?: unknown, confirmPassword?: unknown }>(data: T) {
  const { password: _password, confirmPassword: _confirmPassword, ...safe } = data
  return safe
}

export const loginAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data: authFormSafeData(data),
    }
  }
  const safeData = authFormSafeData(result.data)
  const res = await loginService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data: safeData,
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
      data: authFormSafeData(data),
    }
  }
  const safeData = authFormSafeData(result.data)
  const res = await registerService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data: safeData,
      success: false,
    }
  }
  return { data: safeData, success: true }
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
  const safeData = resetPasswordSafeData(data)
  const result = resetPasswordSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data: safeData,
    }
  }
  const res = await resetPasswordService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data: safeData,
      success: false,
    }
  }
  redirect(LOGIN_PATH)
}

/** Verify-email 409s: another account claimed the username or email before the link was opened. */
const VERIFY_CONFLICT_KEYS: Record<string, 'verifyEmailUsernameTaken' | 'verifyEmailAccountExists'> = {
  'Username already exists; sign up again with another username': 'verifyEmailUsernameTaken',
  'An account with this email already exists': 'verifyEmailAccountExists',
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
    if (Object.hasOwn(VERIFY_CONFLICT_KEYS, res.message)) {
      // The backend spends the link on these conflicts, so retrying it cannot succeed.
      return { error: t(VERIFY_CONFLICT_KEYS[res.message]), linkUsed: true, success: false as const }
    }
    return {
      error: res.message,
      success: false as const,
    }
  }
  return { success: true as const }
}

export async function resendVerificationAction(email: string) {
  const res = await resendVerificationService(email)
  return res.success ? { success: true as const } : { success: false as const, error: res.message }
}

export const changeEmailAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = changeEmailSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors),
      data: { email: data.email },
    }
  }
  const res = await changeEmailService(result.data)
  if (!res.success) {
    return {
      error: res.message,
      data: { email: result.data.email },
      success: false,
    }
  }
  // The response keeps the current email until the link mailed to the new address is opened.
  revalidatePath('/', 'layout')
  return { data: { email: result.data.email }, success: true }
}

export const deleteAccountAction: ActionFunction = async (_, formData) => {
  const result = deleteAccountSchema.safeParse(formDataToObject(formData))
  if (!result.success) {
    return { validationErrors: await localizeAuthFieldErrors(z.flattenError(result.error).fieldErrors) }
  }
  const res = await deleteAccountService(result.data)
  if (!res.success) {
    // The session may have been cleared (see deleteAccountService); refresh the header.
    revalidatePath('/', 'layout')
    return { error: res.message, success: false }
  }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logoutAction() {
  await logoutService()
  revalidatePath('/')
  redirect('/')
}
