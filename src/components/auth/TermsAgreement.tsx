'use client'

import { Checkbox, Description, Label } from '@heroui/react'
import { useTranslations } from 'next-intl'
import AppLink from '@/components/app/AppLink'

interface TermsAgreementProps {
  defaultSelected?: boolean
  onChange?: (selected: boolean) => void
}

export default function TermsAgreement({
  defaultSelected,
  onChange,
}: TermsAgreementProps) {
  const t = useTranslations('auth')
  return (
    <Description
      className="text-small flex items-center"
    >
      <Checkbox
        name="terms"
        id="basic-terms"
        value="true"
        defaultSelected={defaultSelected}
        variant="secondary"
        onChange={onChange}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <Label htmlFor="basic-terms" className="hover:cursor-pointer">
            <span>
              {t('termsAgree')}
            </span>
            <AppLink
              onClick={(e) => e.stopPropagation()}
              className="text-small hover:cursor-pointer"
              isActive
              target="_blank"
              href="/terms"
            >
              {t('termsOfService')}
            </AppLink>
            <span>
              {t('termsAnd')}
            </span>
            <AppLink
              onClick={(e) => e.stopPropagation()}
              className="text-small hover:cursor-pointer"
              isActive
              target="_blank"
              href="/privacy"
            >
              {t('privacyPolicy')}
            </AppLink>
          </Label>
        </Checkbox.Content>
      </Checkbox>
    </Description>
  )
}
