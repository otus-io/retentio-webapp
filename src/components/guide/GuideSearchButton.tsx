'use client'

import { Search } from 'lucide-react'
import { Button, useOverlayState } from '@heroui/react'
import GuideSearchModal from '@/components/guide/GuideSearchModal'

export default function GuideSearchButton() {
  const state = useOverlayState()

  return (
    <>
      <Button
        variant="ghost"
        isIconOnly
        onPress={state.open}
        aria-label="Search"
      >
        <Search size={16} />
      </Button>

      <GuideSearchModal
        isOpen={state.isOpen}
        onOpenChange={state.setOpen}
      />
    </>
  )
}
