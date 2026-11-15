'use client'

import { useState, useTransition } from 'react'
import { mulaiPaketPeta } from '@/app/belajar/actions'

/**
 * Pilihan KEDUA di samping pengayaan yang direkomendasikan: langsung ke
 * Tantangan Akhir. Sengaja berupa tombol berbingkai, bukan tombol biru penuh —
 * yang direkomendasikan tetap pengayaan, dan ujiannya sekali seumur hidup
 * (189), jadi ia tidak boleh tampil seperti langkah default.
 *
 * Membuka paket menurut id ujian yang diberikan langkahnya. Hak membukanya tetap
 * diputuskan `mulaiPaketPeta` dan database, bukan layar ini.
 */
export default function TombolUjianLangsung({
  anak,
  paketId,
}: {
  anak: string | undefined
  paketId: string
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}
      <button
        type="button"
        disabled={sibuk}
        onClick={() => {
          setGalat(null)
          mulai(async () => {
            const hasil = await mulaiPaketPeta(anak, paketId)
            if (hasil && 'error' in hasil) setGalat(hasil.error)
          })
        }}
        className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:bg-slate-50 disabled:text-gray-400"
      >
        {sibuk ? 'Menyiapkan soal…' : 'Langsung ke Tantangan Akhir'}
      </button>
    </div>
  )
}
