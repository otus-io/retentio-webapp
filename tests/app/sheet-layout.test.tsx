import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

const auth = vi.hoisted(() => ({ getProfileService: vi.fn() }))
const provider = vi.fn()

vi.mock('@/modules/auth/auth.service', () => ({ getProfileService: auth.getProfileService }))
vi.mock('@/context/UserContext', () => ({
  UserContextProvider: ({ children, user }: { children?: ReactNode; user: unknown }) => {
    provider(user)
    return <div>{children}</div>
  },
}))
vi.mock('@/components/layout/TopNav', () => ({ default: () => <nav>top</nav> }))
vi.mock('@/components/auth/EmailVerificationBanner', () => ({ default: () => <aside>verify banner</aside> }))

import Layout from '@/app/(sheet)/layout'

describe('(sheet) layout', () => {
  it('fills the window with nav, banner and page, and no footer or page scroll', async () => {
    const user = { success: true, data: { username: 'alice' } }
    auth.getProfileService.mockResolvedValueOnce(user)
    const { container } = render(await Layout({ children: <p>page</p> }))
    const order = [...container.querySelectorAll('nav, aside, main')].map((el) => el.textContent)
    expect(order).toEqual(['top', 'verify banner', 'page'])
    expect(container.querySelector('footer')).toBeNull()
    expect(container.querySelector('section')?.className).toContain('h-dvh flex flex-col overflow-hidden')
    expect(provider).toHaveBeenLastCalledWith(user)
  })

  it('passes no user when the profile fails to load', async () => {
    auth.getProfileService.mockResolvedValueOnce({ success: false })
    render(await Layout({ children: <p>page</p> }))
    expect(provider).toHaveBeenLastCalledWith(null)
  })
})
