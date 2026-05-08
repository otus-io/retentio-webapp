import { Breadcrumbs } from '@heroui/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AppBreadcrumbs({
  items,
}: {
  items: { href: string, title: string }[]
}) {
  const t = useTranslations()
  const normalizedItems = [
    { href: '/', title: t('nav.home') },
    ...items,
  ]
  return (
    <Breadcrumbs>
      {normalizedItems.map((item, index) => (
        <Breadcrumbs.Item
          key={index}
        >
          {
            item.href ? <Link href={item.href}>{item.title}</Link>: item.title
          }
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  )
}
