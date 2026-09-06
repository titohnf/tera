'use client'

import { useState, useTransition } from 'react'
import { mulaiLangkahTopik } from '@/app/belajar/actions'

/**
 * Tombol yang membuka langkah berikutnya sebuah topik.
 *
 * Yang dikirim cuma id TOPIKNYA, bukan id paketnya — pilihan yang sama dengan
 * `mulaiLangkahTopik` dan alasannya juga sama: halaman ini bisa saja sudah
 * dibuka sejak semalam, dan paket yang tertulis di layarnya mungkin sudah
 * dituntaskan anaknya di perangkat lain. Yang menentukan paket mana yang dibuka
 * database, pada detik tombolnya ditekan.
 *
 * Komponen browser karena aksinya bisa pulang dengan kalimat galat — paket yang
 * kuncinya baru saja terkunci, misalnya. Itu bukan layar rusak, jadi yang
 * muncul kalimat, bukan halaman kosong.
 */
export default function TombolLangkah({
  anak,
  topikId,
  label,
}: {
  anak: string | undefined
  topikId: string
  /** Bunyi tombolnya, dirakit pemanggil supaya ia menyebut paketnya. */
  label: string
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
            const hasil = await mulaiLangkahTopik(anak, topikId)
            if (hasil && 'error' in hasil) setGalat(hasil.error)
          })
        }}
        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {sibuk ? 'Menyiapkan soal…' : label}
      </button>
    </div>
  )
}
