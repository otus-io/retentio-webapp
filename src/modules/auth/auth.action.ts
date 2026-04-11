'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'
import { formDataToObject } from '@/utils/format'
import { loginSchema, registerSchema } from './auth.schema'
import { loginService, registerService, logoutService } from './auth.service'

export const loginAction: ActionFunction = async (_, formData) => {
  const data = formDataToObject(formData)
  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return {
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await loginService(result.data)
  if (!res.ok) {
    return {
      error: res.error,
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
      validationErrors: z.flattenError(result.error).fieldErrors,
      data,
    }
  }
  const res = await registerService(result.data)
  if (!res.ok) {
    return {
      error: res.error,
      data,
      success: false,
    }
  }
  revalidatePath('/')
  redirect(result.data.redirect || '/')
}

export async function logoutAction() {
  await logoutService()
  revalidatePath('/')
  redirect('/')
}
