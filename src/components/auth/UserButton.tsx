'use client'

import { useTranslations } from 'next-intl'
import AppAvatar from '@/components/app/AppAvatar'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import { ProfileResponseDTO } from '@/modules/auth/auth.schema'
import { LOGIN_PATH } from '@/config'
import { useRouter } from 'next/navigation'
import { Dropdown, Key, Label, useOverlayState } from '@heroui/react'
import LogoutModal from '@/components/auth/LogoutModal'

interface UserButtonProps {
  user?: ProfileResponseDTO | null
}


export default function UserButton({ user }: UserButtonProps) {
  const t = useTranslations('common')

  if (user) {
    return (
      <UserAvatar user={user} />
    )
  }

  return (
    <AppButtonLink
      href={LOGIN_PATH}
      style={{ '--radius': '0.1em' }}
    >
      {t('login')}
    </AppButtonLink>
  )
}



function UserAvatar({ user }: { user: ProfileResponseDTO }) {
  const router = useRouter()
  const state = useOverlayState()
  function handleAction(key: Key) {
    switch (key) {
      case 'profile':
        router.push('/profile')
        break
      case 'logout':
        state.setOpen(true)
        break
    }
  }
  return (
    <>
      <Dropdown>
        <Dropdown.Trigger>
          <AppAvatar
            className="cursor-pointer"
            size="md"
            color="accent"
          >
            {user.data.username.charAt(0).toUpperCase()}
          </AppAvatar>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            <Dropdown.Item id="profile">
              <Label>个人中心</Label>
            </Dropdown.Item>
            <Dropdown.Item id="logout" textValue="退出登录" variant="danger">
              <Label>退出登录</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <LogoutModal
        {...state}
      />
    </>
  )
}
