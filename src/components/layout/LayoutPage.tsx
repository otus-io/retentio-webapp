import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'

interface LayoutPageProps {
  children: React.ReactNode
  breadcrumbs?: React.ComponentProps<typeof AppBreadcrumbs>['items']
  /** Shown at the end of the breadcrumb row, e.g. a page-level menu */
  actions?: React.ReactNode
}

export default function LayoutPage({
  children,
  breadcrumbs,
  actions,
}: LayoutPageProps) {
  return (
    <div className="py-4 max-w-content mx-auto px-3.5 min-h-[calc(100vh-19.375rem)] md:min-h-[calc(100vh-16.625rem)]">
      {
        (breadcrumbs != undefined && breadcrumbs?.length) && (
          <div className="mb-4 flex items-center justify-between gap-2">
            <AppBreadcrumbs
              items={breadcrumbs}
            />
            {actions}
          </div>
        )
      }
      {children}
    </div>
  )
}
