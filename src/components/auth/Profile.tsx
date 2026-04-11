import { Card, Separator } from '@heroui/react'
import { Calendar, Mail, User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import AppAvatar from '@/components/app/AppAvatar'
import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'

interface ProfileProps {
  user: ProfileResponseDTO
}

export default async function Profile({ user }: ProfileProps) {
  const t = await getTranslations('profile')

  const createdDate = user.meta.created_at
    ? new Date(user.meta.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '—'

  const infoItems = [
    {
      icon: User,
      label: t('username'),
      value: user.data.username,
    },
    {
      icon: Mail,
      label: t('email'),
      value: user.data.email,
    },
    {
      icon: Calendar,
      label: t('memberSince'),
      value: createdDate,
    },
  ]

  return (
    <div className="flex-1 py-6 md:py-10 max-w-xl w-full px-4 mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        {t('title')}
      </h1>

      <Card>
        <Card.Content>
          <div className="flex flex-col items-center py-4">
            <AppAvatar size="lg">
              {user.data.username.charAt(0).toUpperCase()}
            </AppAvatar>
            <p className="mt-3 text-lg font-semibold">{user.data.username}</p>
            <p className="text-sm text-muted">{user.data.email}</p>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col gap-2">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-default/40"
              >
                <item.icon className="size-5 text-accent shrink-0" />
                <div>
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
