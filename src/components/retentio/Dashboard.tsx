import { Card, Chip } from '@heroui/react'
import { Clock, Flame, Layers, SquareStack } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ProfileResponseDTO } from '@/modules/auth/auth.schema'

interface DashboardProps {
  user: ProfileResponseDTO
}

const stats = [
  { key: 'totalDecks' as const, value: 12, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { key: 'totalCards' as const, value: 348, icon: SquareStack, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'dueToday' as const, value: 24, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'streak' as const, value: 7, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
]

const recentDecks = [
  { name: 'Japanese N5 Vocabulary', cards: 120, due: 8 },
  { name: 'Spanish Verbs', cards: 85, due: 12 },
  { name: 'Medical Terminology', cards: 200, due: 4 },
  { name: 'History Dates', cards: 43, due: 0 },
]

const gradients = [
  'from-indigo-100 to-indigo-200 dark:from-indigo-950 dark:to-indigo-900',
  'from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900',
  'from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900',
  'from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900',
]

export default async function Dashboard({ user }: DashboardProps) {
  const t = await getTranslations('dashboard')

  return (
    <div className="py-6 md:py-10 max-w-content w-full px-4 md:px-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t('welcome', { name: user.data.username })}
        </h1>
        <p className="text-muted mt-1">{t('title')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <Card.Content>
              <div className="flex items-center gap-3 py-1">
                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-tight">{stat.value}</p>
                  <p className="text-xs text-muted">{t(stat.key)}</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Recent Decks */}
      <h2 className="text-xl font-semibold mb-4">{t('recentDecks')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {recentDecks.map((deck, idx) => (
          <Card key={idx} className="cursor-pointer transition-transform hover:-translate-y-1">
            <Card.Content>
              <div className={`w-full aspect-video rounded-xl mb-3 bg-linear-to-br ${gradients[idx]} flex items-center justify-center`}>
                <Layers className="size-10 opacity-15" />
              </div>
              <p className="font-semibold truncate">{deck.name}</p>
              <div className="flex gap-1.5 mt-2">
                <Chip size="sm" variant="secondary">{t('cards', { count: deck.cards })}</Chip>
                {deck.due > 0 && (
                  <Chip size="sm" variant="tertiary">{t('due', { count: deck.due })}</Chip>
                )}
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  )
}
