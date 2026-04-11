
import type { ButtonProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { Button, Spinner } from '@heroui/react'

export interface AppButtonProps extends ButtonProps {
  icon?: ReactNode
}

export default function AppButton({
  children,
  icon,
  ...reset
}: AppButtonProps) {
  return (
    <Button
      {...reset}
    >
      {(renderProps) => (
        <>
          {renderProps.isPending
            ? (
              <Spinner
                color="current"
                size="sm"
              />
            )
            : icon}
          {typeof children === 'function'
            ? children(renderProps)
            : children}
        </>
      )}
    </Button>
  )
}

export function SubmitButton(props?: Omit<AppButtonProps, 'type'>) {
  return (
    <AppButton
      type="submit"
      key="submit"
      {...props}
    >
      {props?.children || '提交'}
    </AppButton>
  )
}

export function ResetButton(props?: Omit<AppButtonProps, 'type'>) {
  return (
    <AppButton
      type="reset"
      variant="outline"
      key="reset"
      {...props}
    >
      {props?.children || '重置'}
    </AppButton>
  )
}
