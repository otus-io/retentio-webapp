import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'

const pushMock = vi.fn()
const router = { push: pushMock }
const calls: string[] = []

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: () => router,
}))

import { usePathname } from 'next/navigation'
import { UserContextProvider, useUserContext } from '@/context/UserContext'

const profile = {
  data: { email: 'a@b.com', username: 'alice' },
  meta: { created_at: '2020-01-01T00:00:00.000Z', msg: 'ok' },
} satisfies ProfileResponseDTO

function Consumer() {
  const { user, isLogin, accessAction } = useUserContext()
  return (
    <div>
      <span data-testid="isLogin">{String(isLogin)}</span>
      <span data-testid="username">{user?.data.username ?? ''}</span>
      <button
        type="button"
        data-testid="run"
        onClick={() => {
          accessAction(() => {
            calls.push('ran')
          })
        }}
      >
        run
      </button>
      <button
        type="button"
        data-testid="skip"
        onClick={() => {
          accessAction(undefined as unknown as () => void)
        }}
      >
        skip
      </button>
    </div>
  )
}

describe('UserContext', () => {
  beforeEach(() => {
    calls.length = 0
    pushMock.mockClear()
    vi.mocked(usePathname).mockReturnValue('/decks/42')
  })

  it('renders children for a logged-in user and runs the allowed action', () => {
    render(
      <UserContextProvider user={profile}>
        <Consumer />
      </UserContextProvider>,
    )

    expect(screen.getByTestId('isLogin').textContent).toBe('true')
    expect(screen.getByTestId('username').textContent).toBe('alice')

    fireEvent.click(screen.getByTestId('run'))

    expect(calls).toEqual(['ran'])
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('does nothing when a logged-in user triggers an action that is missing', () => {
    render(
      <UserContextProvider user={profile}>
        <Consumer />
      </UserContextProvider>,
    )

    fireEvent.click(screen.getByTestId('skip'))

    expect(calls).toEqual([])
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('sends a logged-out visitor to login and keeps the current path', () => {
    render(
      <UserContextProvider>
        <Consumer />
      </UserContextProvider>,
    )

    expect(screen.getByTestId('isLogin').textContent).toBe('false')
    expect(screen.getByTestId('username').textContent).toBe('')

    fireEvent.click(screen.getByTestId('run'))

    expect(calls).toEqual([])
    expect(pushMock).toHaveBeenCalledWith('/login?redirect=/decks/42')
  })

  it('uses a no-op action outside the provider', () => {
    render(<Consumer />)

    expect(screen.getByTestId('isLogin').textContent).toBe('false')
    expect(screen.getByTestId('username').textContent).toBe('')

    fireEvent.click(screen.getByTestId('run'))
    fireEvent.click(screen.getByTestId('skip'))

    expect(calls).toEqual([])
    expect(pushMock).not.toHaveBeenCalled()
  })
})
