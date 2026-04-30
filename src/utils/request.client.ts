'use client'

import { createRequest } from './createRequest'
import { getClientToken } from '@/lib/token.client'

export const requestClient = createRequest(getClientToken)
