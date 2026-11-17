'use client'

import { useState, useTransition } from 'react'
import { mulaiLangkahTopik } from '@/app/belajar/actions'

/**
 * Memulai langkah berikutnya sebuah topik, dengan keadaan sibuk dan galatnya.
 *
 * Dipakai kartu "Misi hari ini" dan lembar rincian topik — dua tombol yang
 * melakukan hal sama persis. Aksinya MENULIS (melahirkan sesi) lalu mengalihkan
 * halaman; hanya kegagalan yang pulang ke sini sebagai `{ error }`.
 */
export function useMulaiLangkah(anak: string | undefined) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulaiTransisi] = useTransition()

  function mulai(topikId: string) {
    setGalat(null)
    mulaiTransisi(async () => {
      const hasil = await mulaiLangkahTopik(anak, topikId)
      if (hasil && 'error' in hasil) setGalat(hasil.error)
    })
  }

  return { galat, sibuk, mulai, hapusGalat: () => setGalat(null) }
}
