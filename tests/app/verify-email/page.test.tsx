import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const panelCalls: Array<{
  token: string
  initialStatus: string
  initialError: string | null
}> = []

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) => {
    return (key: string) => (namespace ? `${namespace}.${key}` : key)
  },
}))

vi.mock('@/components/auth/VerifyEmailPanel', () => ({
  default: (props: {
    token: string
    initialStatus: string
    initialError: string | null
  }) => {
    panelCalls.push(props)
    return (
      <div
        data-testid="verify-email-panel"
        data-status={props.initialStatus}
        data-token={props.token}
      />
    )
  },
}))

import Page, { generateMetadata } from '@/app/(default)/(public)/verify-email/page'

function pageProps(searchParams: Record<string, string | string[] | undefined>) {
  return {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(searchParams),
  } as Parameters<typeof Page>[0]
}

describe('verify-email page', () => {
  beforeEach(() => {
    panelCalls.length = 0
  })

  it('does not treat verified=1 as success without a token', async () => {
    render(await Page(pageProps({ verified: '1' })))
    expect(panelCalls).toHaveLength(1)
    expect(panelCalls[0]).toEqual({
      token: '',
      initialStatus: 'error',
      initialError: 'auth.verifyEmailMissingToken',
    })
  })

  it('does not treat verified=true as success without a token', async () => {
    render(await Page(pageProps({ verified: 'true' })))
    expect(panelCalls[0]?.initialStatus).toBe('error')
    expect(panelCalls[0]?.token).toBe('')
  })

  it('starts pending when a token is present, ignoring verified query', async () => {
    render(await Page(pageProps({ token: ' real-tok ', verified: '1' })))
    expect(panelCalls[0]).toEqual({
      token: 'real-tok',
      initialStatus: 'pending',
      initialError: null,
    })
  })

  it('exposes verify-email metadata titles', async () => {
    const meta = await generateMetadata()
    expect(meta).toEqual({
      title: 'auth.verifyEmailTitle',
      description: 'auth.verifyEmailDescription',
    })
  })
})
