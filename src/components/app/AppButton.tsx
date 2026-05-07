
import type { ButtonProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { Button, Spinner } from '@heroui/react'
import { useTranslations } from 'next-intl'

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
                className="size-3.5"
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
  const t = useTranslations()
  return (
    <AppButton
      type="submit"
      key="submit"
      {...props}
    >
      {props?.children || t('common.submit')}
    </AppButton>
  )
}

export function ResetButton(props?: Omit<AppButtonProps, 'type'>) {
  const t = useTranslations()
  return (
    <AppButton
      type="reset"
      variant="outline"
      key="reset"
      {...props}
    >
      {props?.children || t('common.reset')}
    </AppButton>
  )
}
