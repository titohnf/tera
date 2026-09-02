'use client'

import { useState, useTransition } from 'react'
import { mulaiPemanasan } from '@/app/belajar/actions'
import type { Sapaan } from '@/lib/belajar/kunjungan'

/**
 * Sapaan sesudah jeda, beserta tawaran pemanasan yang boleh diabaikan (FR12).
 *
 * TAWARAN, BUKAN GERBANG. Menolaknya tidak menutup apa pun dan tidak dicatat
 * sebagai apa pun — Alur Kunjungan Kembali Bagian 4.2 menyebut alasannya:
 * memaksa asesmen di awal kembali terasa seperti ujian dadakan, tepat pada
 * orang yang paling rapuh niatnya untuk kembali. Karena itu tombol keduanya
 * "Langsung lanjut saja", bukan "Nanti dulu" yang menyiratkan utang.
 *
 * Penolakannya cuma menyembunyikan kartunya untuk kunjungan ini, tidak
 * disimpan: yang tidak disimpan tidak bisa dipakai menyimpulkan apa pun tentang
 * anaknya nanti.
 */
export default function SapaanKunjungan({
  sapaan,
  anak,
}: {
  sapaan: Sapaan
  anak?: string
}) {
  const [tampil, setTampil] = useState(true)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  if (!tampil) return null

  return (
    <div className="rounded-xl bg-blue-50 p-4">
      <p className="text-sm font-medium leading-relaxed text-blue-900">{sapaan.teks}</p>

      {sapaan.tawarkanPemanasan && (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-blue-800">
            Sebelum lanjut, mau pemanasan dulu? Cuma beberapa soal dari yang kemarin dipelajari.
          </p>
          {galat && <p className="mt-2 text-sm text-amber-800">{galat}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sibuk}
              onClick={() => {
                setGalat(null)
                mulai(async () => {
                  const hasil = await mulaiPemanasan(anak)
                  if (hasil && 'error' in hasil) setGalat(hasil.error)
                })
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
            >
              Pemanasan Dulu
            </button>
            <button
              type="button"
              onClick={() => setTampil(false)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-50"
            >
              Langsung lanjut saja
            </button>
          </div>
        </>
      )}
    </div>
  )
}
