import { Alert } from '@heroui/react'
import { formatErrorMessage } from '@/utils/format'

export default function AppError({
  error,
}: { error: Error | string | null | undefined }) {
  if (!error)
    return null
  const message = formatErrorMessage(error)
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>发生错误</Alert.Title>
        <Alert.Description>
          {message}
        </Alert.Description>
      </Alert.Content>
    </Alert>
  )
}
