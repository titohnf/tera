'use client'

import { useState, useTransition } from 'react'
import { mulaiRetest } from '@/app/belajar/actions'
import type { RetestJatuhTempo } from '@/lib/belajar/retest'

/**
 * Ajakan membuktikan ulang topik yang sudah tuntas (FR11).
 *
 * FRAMINGNYA BUKAN "KAMU HARUS DIUJI LAGI". Retest bukan hukuman dan bukan
 * tanda ada yang salah — ia justru muncul karena topiknya sudah tuntas, dan
 * kalimatnya harus mengatakan itu. Anak yang membacanya sebagai "nilaiku
 * dicabut" akan menundanya, dan retest yang ditunda tidak mengukur apa pun.
 *
 * Tidak ada tenggat, tidak ada hitung mundur, tidak ada penanda "terlambat".
 * Dokumen Retest Terjadwal Bagian 4.3 melarang penalti keterlambatan secara
 * eksplisit: yang tertunda cuma gilirannya, bukan haknya.
 *
 * Komponen browser karena tombolnya memanggil server action yang bisa pulang
 * dengan kalimat galat — kolam probe yang belum cukup berisi, misalnya, yang
 * bukan layar rusak melainkan keadaan yang wajar di awal.
 */
export default function KartuRetest({
  retest,
  anak,
}: {
  retest: RetestJatuhTempo[]
  anak?: string
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  if (retest.length === 0) return null

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {retest.map(r => (
        <div key={r.topikId} className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            Waktunya mengecek ulang {r.nama}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">
            {r.mendesak
              ? 'Topik dasarnya perlu dilihat lagi, jadi topik ini sekalian dicek supaya tahu ia masih kuat.'
              : 'Kamu sudah menuntaskannya beberapa waktu lalu. Beberapa soal singkat untuk memastikan ia masih melekat.'}
          </p>
          <button
            type="button"
            disabled={sibuk}
            onClick={() => {
              setGalat(null)
              mulai(async () => {
                const hasil = await mulaiRetest(r.topikId, anak)
                if (hasil && 'error' in hasil) setGalat(hasil.error)
              })
            }}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-gray-300"
          >
            Mulai Pengecekan
          </button>
        </div>
      ))}
    </div>
  )
}
