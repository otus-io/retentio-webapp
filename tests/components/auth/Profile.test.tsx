import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@heroui/react', async () => (await import('../../helpers/heroui')).herouiMock())
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/components/app/AppAvatar', () => ({ default: () => null }))
vi.mock('@/components/auth/ProfileActions', () => ({
  default: ({ email }: { email: string }) => <div data-testid="actions">{email}</div>,
}))

import Profile from '@/components/auth/Profile'

describe('Profile', () => {
  it('renders account actions', async () => {
    render(await Profile({
      user: { data: { username: 'alice', email: 'a@b.com' }, meta: { msg: 'ok' } } as never,
    }))
    expect(screen.getByTestId('actions').textContent).toBe('a@b.com')
    expect(screen.queryByRole('img', { name: 'emailVerified' })).toBeNull()
  })

  it('marks a verified email', async () => {
    render(await Profile({
      user: { data: { username: 'alice', email: 'a@b.com', email_verified: true }, meta: { msg: 'ok' } } as never,
    }))
    expect(screen.getByRole('img', { name: 'emailVerified' })).toBeTruthy()
  })
})
