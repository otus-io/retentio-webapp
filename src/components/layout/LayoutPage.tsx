import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'

interface LayoutPageProps {
  children: React.ReactNode
  breadcrumbs?: React.ComponentProps<typeof AppBreadcrumbs>['items']
}

export default function LayoutPage({
  children,
  breadcrumbs,
}: LayoutPageProps) {
  return (
    <div className="py-4 max-w-content mx-auto px-3.5 min-h-[calc(100vh-19.375rem)] md:min-h-[calc(100vh-16.625rem)]">
      {
        (breadcrumbs != undefined && breadcrumbs?.length) && (
          <div className="mb-4">
            <AppBreadcrumbs
              items={breadcrumbs}
            />
          </div>
        )
      }
      {children}
    </div>
  )
}
