import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('@/modules/auth/auth.service', () => ({
  getProfileService: vi.fn(async () => ({ success: true, data: { username: 'alice' } })),
}))
vi.mock('@/context/UserContext', () => ({
  UserContextProvider: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/layout/TopNav', () => ({ default: () => <nav>top</nav> }))
vi.mock('@/components/layout/Footer', () => ({ default: () => <footer>bottom</footer> }))
vi.mock('@/components/auth/EmailVerificationBanner', () => ({ default: () => <aside>verify banner</aside> }))

import Layout from '@/app/(default)/layout'

describe('(default) layout', () => {
  it('shows the email verification banner under the top nav', async () => {
    render(await Layout({ children: <main>page</main> }))
    const order = [...document.body.querySelectorAll('nav, aside, main')].map((el) => el.textContent)
    expect(order).toEqual(['top', 'verify banner', 'page'])
    expect(screen.getByText('bottom')).toBeDefined()
  })
})
