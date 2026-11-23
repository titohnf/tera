'use client'

import LayarGalat from '@/components/ui/LayarGalat'

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const beranda = '/mandiri'
  return <LayarGalat error={error} reset={reset} beranda={beranda} />
}
