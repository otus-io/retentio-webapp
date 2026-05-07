import { Alert } from '@heroui/react'
import { formatErrorMessage } from '@/utils/format'
import clsx from 'clsx'

export default function AppError({
  error,
  page,
}: {
  error: Error | string | null | undefined,
  page?: boolean
}) {
  if (!error)
    return null
  const message = formatErrorMessage(error)
  return (
    <div className={clsx(page?'py-4 max-w-content mx-auto px-3.5':undefined)}>
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>发生错误</Alert.Title>
          <Alert.Description>
            {message}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    </div>
  )
}
