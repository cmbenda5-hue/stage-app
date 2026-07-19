// app/company/page.tsx
'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LegacyCompanyRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  useEffect(() => {
    if (id) {
      router.replace(`/company/${id}`)
    } else {
      router.replace('/dashboard')
    }
  }, [id, router])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', color: '#64748b', fontSize: '14px' }}>
      Redirection...
    </main>
  )
}

export default function LegacyCompanyPage() {
  return (
    <Suspense fallback={null}>
      <LegacyCompanyRedirect />
    </Suspense>
  )
}