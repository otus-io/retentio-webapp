'use client'

import AppErrorPage from '@/components/app/AppErrorPage'

export default function Error() {
  return (
    <>
      <AppErrorPage
        code={500}
        message="Something went wrong!"
      />
    </>
  )
}
