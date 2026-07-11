/* eslint-disable react-refresh/only-export-components */
'use client'

import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { createContext, use, useMemo } from 'react'

interface IUserContext {
  user: ProfileResponseDTO | null
  isLogin: boolean
  accessAction: (action:() => void) => void
}

const UserContext = createContext<IUserContext>({
  user: null,
  isLogin: false,
  accessAction: () => void 0,
})


export function UserContextProvider({
  user = null,
  children,
}: {
  user?: ProfileResponseDTO | null,
  children: ReactNode
}) {

  const pathname = usePathname()
  const router = useRouter()
  const value = useMemo<IUserContext>(() => {
    return {
      user,
      isLogin: !!user,
      accessAction(action:() => void) {
        if(user){
          action?.()
        }else{
          router.push(`/login?redirect=${pathname}`)
        }
      },
    }
  }, [pathname, router, user])

  return (
    <UserContext value={value}>
      {children}
    </UserContext>
  )
}


export function useUserContext(){
  return use(UserContext)
}
