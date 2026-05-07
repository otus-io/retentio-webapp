import type { InputProps, TextFieldProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { Description, FieldError, InputGroup, Label, TextField } from '@heroui/react'
import { useMemo } from 'react'

export interface AppInputProps extends TextFieldProps {
  label?: ReactNode
  description?: ReactNode
  placeholder?: string
  inputProps?: Omit<InputProps, 'placeholder'>
  prefix?: ReactNode
  suffix?: ReactNode
}

export default function AppInput({
  label,
  description,
  inputProps,
  placeholder,
  prefix,
  suffix,
  ...rest
}: AppInputProps) {
  const variant = useMemo(() => {
    return inputProps?.variant
  }, [inputProps?.variant])
  return (
    <TextField {...rest}>
      {
        label && <Label>{label}</Label>
      }
      <InputGroup variant={variant}>
        {prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
        { }
        <InputGroup.Input {...inputProps} placeholder={placeholder} />
        {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
      </InputGroup>
      {
        description && <Description>{description}</Description>
      }
      <FieldError />
    </TextField>
  )
}
