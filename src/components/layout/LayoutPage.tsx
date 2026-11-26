import AppBreadcrumbs from '@/components/app/AppBreadcrumbs'
import clsx from 'clsx'

interface LayoutPageProps {
  children: React.ReactNode
  breadcrumbs?: React.ComponentProps<typeof AppBreadcrumbs>['items']
  /** Shown at the end of the breadcrumb row, e.g. a page-level menu */
  actions?: React.ReactNode
  /** Fill the parent's width and height instead of the centered content column (e.g. the facts sheet) */
  fullScreen?: boolean
}

export default function LayoutPage({
  children,
  breadcrumbs,
  actions,
  fullScreen,
}: LayoutPageProps) {
  return (
    <div
      className={clsx(
        'py-4 mx-auto px-3.5',
        fullScreen
          ? 'w-full h-full flex flex-col'
          : 'max-w-content min-h-[calc(100vh-19.375rem)] md:min-h-[calc(100vh-16.625rem)]',
      )}
    >
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
