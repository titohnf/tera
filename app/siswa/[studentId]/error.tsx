'use client'

import { useParams } from 'next/navigation'
import LayarGalat from '@/components/ui/LayarGalat'

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { studentId } = useParams<{ studentId: string }>()
  const beranda = `/siswa/${studentId}`
  return <LayarGalat error={error} reset={reset} beranda={beranda} />
}
