'use server'

import { createRequest } from './createRequest'
import { getToken } from '@/lib/token'

export const request = createRequest(getToken)
