'use client'

import { useTranslations } from 'next-intl'
import AppAvatar from '@/components/app/AppAvatar'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'
import { LOGIN_PATH } from '@/config'
import { useRouter } from 'next/navigation'
import type { Key } from '@heroui/react'
import { Dropdown, Label, useOverlayState } from '@heroui/react'
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
  const t = useTranslations()
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
        <Dropdown.Popover isNonModal>
          <Dropdown.Menu onAction={handleAction}>
            <Dropdown.Item id="profile">
              <Label>{t('profile.title')}</Label>
            </Dropdown.Item>
            <Dropdown.Item id="logout"variant="danger">
              <Label>{t('common.logout')}</Label>
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
