'use client'
import type { AppInputProps } from '@/components/app/AppInput'
import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import AppInput from '@/components/app/AppInput'

export interface AppPasswordInputProps extends AppInputProps {

}
export default function AppPasswordInput({
  inputProps: _inputProps,
  ...props
}: AppPasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsVisible(!isVisible)
  }, [isVisible])

  const inputProps = useMemo(() => {
    return {
      type: isVisible ? 'text' : 'password',
      ..._inputProps,
    } satisfies Omit<AppInputProps['inputProps'], 'children'>
  }, [isVisible, _inputProps])

  return (
    <AppInput
      {...props}
      inputProps={inputProps}
      suffix={(
        <button
          type="button"
          onClick={toggleVisibility}
          className="flex items-center justify-center hover:cursor-pointer"
        >
          {
            isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />
          }
        </button>
      )}
    />
  )
}
