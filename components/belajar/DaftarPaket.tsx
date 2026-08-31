'use client'

import { useEffect, useState, useTransition } from 'react'
import type { PaketTopik } from '@/lib/belajar/sesi'
import { mulaiPaket, muatPaket } from '@/app/belajar/actions'
import { persenDari } from '@/lib/belajar/penilaian'
import { SOAL_PER_PAKET } from '@/lib/belajar/aturan'

/**
 * Paket-paket sebuah topik, dan keadaan masing-masing.
 *
 * Sebuah paket BUKAN undian: isinya potongan tetap dari bank soal topiknya —
 * Paket 1 selalu sepuluh soal yang sama, bagi siapa pun, kapan pun. Karena itu
 * layar ini daftar, bukan satu tombol "Mulai Latihan": yang dipilih anak bukan
 * "sepuluh soal entah yang mana", melainkan bagian mana dari topik ini yang
 * mau ia hadapi.
 *
 * Tiap baris menyebutkan tiga hal, dan ketiganya menentukan apakah baris itu
 * masih bisa diketuk:
 *
 *   berapa benar    keadaan sekarang dari soal-soal paket itu — hanya bisa naik
 *   putaran         sudah berapa kali dikerjakan sampai tuntas
 *   terkunci        kuncinya sudah dibuka, jadi nilainya berhenti di situ
 *
 * Paket yang sudah benar semua juga tidak bisa diketuk lagi, dan itu bukan
 * hukuman melainkan kabar baik yang tidak perlu diulang.
 */
export default function DaftarPaket({
  anak,
  groupId,
  jumlahSoal,
}: {
  anak: string | undefined
  groupId: string
  /** Soal di topik ini — dipakai menggambar kerangka sebelum datanya datang. */
  jumlahSoal: number
}) {
  const [paket, setPaket] = useState<PaketTopik[] | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  useEffect(() => {
    let hidup = true
    muatPaket(anak, groupId)
      .then(d => {
        if (hidup) setPaket(d)
      })
      .catch(() => {
        if (hidup) setPaket([])
      })
    return () => {
      hidup = false
    }
  }, [anak, groupId])

  function buka(nomor: number) {
    setGalat(null)
    mulai(async () => {
      const hasil = await mulaiPaket(anak, groupId, nomor)
      if (hasil && 'error' in hasil) setGalat(hasil.error)
    })
  }

  if (paket === null) {
    // Kerangka sebanyak paket yang PASTI ada, dihitung dari jumlah soalnya.
    // Kerangka yang jumlahnya asal membuat layar melompat begitu data datang.
    const perkiraan = Math.max(1, Math.ceil(jumlahSoal / SOAL_PER_PAKET))
    return (
      <div className="space-y-2">
        {Array.from({ length: perkiraan }, (_, i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-xl bg-white shadow-kartu" />
        ))}
      </div>
    )
  }

  if (paket.length === 0) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-500 shadow-kartu">
        Topik ini belum punya soal, jadi latihannya belum bisa dimulai.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {paket.map(p => {
        const tuntas = p.benar >= p.total
        const bisa = !p.terkunci && !tuntas
        const persen = p.maks > 0 ? persenDari(p.skor, p.maks) : null
        const belumTersentuh = p.putaran === 0

        const isi = (
          <>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">Paket {p.nomor}</span>
                <span className="text-xs text-gray-400">{p.total} soal</span>
              </span>
              <span className="mt-0.5 block text-sm text-gray-500">
                {belumTersentuh
                  ? 'Belum dikerjakan'
                  : `${p.benar} dari ${p.total} benar${
                      p.putaran > 1 ? ` · ${p.putaran} putaran` : ''
                    }`}
              </span>
              {p.terkunci && (
                <span className="mt-0.5 block text-xs text-gray-400">
                  Terkunci — kuncinya sudah dibuka
                </span>
              )}
              {tuntas && !p.terkunci && (
                <span className="mt-0.5 block text-xs text-emerald-600">Benar semua</span>
              )}
            </span>
            {persen != null && !belumTersentuh && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {persen}%
              </span>
            )}
          </>
        )

        const gaya = 'flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-kartu'

        return bisa ? (
          <button
            key={p.nomor}
            type="button"
            disabled={sibuk}
            onClick={() => buka(p.nomor)}
            className={`${gaya} transition hover:bg-slate-50 disabled:opacity-60`}
          >
            {isi}
          </button>
        ) : (
          // Bukan tombol mati melainkan bukan tombol sama sekali: sasaran ketuk
          // yang tidak melakukan apa-apa membuat orang mengetuknya berkali-kali
          // untuk memastikan.
          <div key={p.nomor} className={`${gaya} opacity-70`}>
            {isi}
          </div>
        )
      })}
    </div>
  )
}
