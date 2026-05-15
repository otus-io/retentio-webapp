import { Tooltip } from '@heroui/react'
import type { ReactNode } from 'react'

interface AppTooltipProps {
  children: ReactNode
  content: ReactNode
  trigger?: boolean
}
export default function AppTooltip({
  trigger = true,
  children,
  content,
}: AppTooltipProps) {
  return (
    <Tooltip delay={0}>
      {
        trigger
          ? (
            <Tooltip.Trigger>
              {children}
            </Tooltip.Trigger>
          )
          : children
      }

      <Tooltip.Content>
        {content}
      </Tooltip.Content>
    </Tooltip>
  )
}
