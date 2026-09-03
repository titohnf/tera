'use client'

import { useState, useTransition } from 'react'
import { mulaiPenempatan } from '@/app/belajar/actions'

/**
 * Tawaran tes penempatan sebuah topik (Dokumen Fondasi Bagian 3.1).
 *
 * FRAMINGNYA MENAWARKAN WAKTU, BUKAN MENGUJI. Yang dijanjikan dokumennya
 * adalah anak yang sudah kompeten tidak dipaksa mengerjakan yang sudah pasti ia
 * kuasai — jadi kalimat di sini menjanjikan itu, bukan "kamu akan dites dulu".
 * Anak yang membacanya sebagai ujian masuk akan menghindarinya, dan tes
 * penempatan yang dihindari tidak menempatkan siapa pun.
 *
 * SEKALI SAJA, dan itu disebutkan di muka. Tes yang boleh diulang berhenti jadi
 * penempatan dan berubah jadi jalan pintas; menyembunyikan aturan itu sampai
 * sesudah dikerjakan berarti membiarkan anak menemukan harganya terlambat —
 * kesalahan yang sama dengan tombol kunci jawaban yang tidak menyebutkan
 * harganya.
 */
export default function KartuPenempatan({
  topikId,
  anak,
}: {
  topikId: string
  anak?: string
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  return (
    <div className="mb-2 rounded-xl bg-blue-50 p-4">
      {galat && (
        <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{galat}</p>
      )}
      <p className="text-sm font-semibold text-blue-900">Mulai dari tes penempatan?</p>
      <p className="mt-1 text-sm leading-relaxed text-blue-800">
        Delapan soal singkat. Kalau kamu sudah menguasai bagian awalnya, paket
        yang mudah akan dilewati supaya kamu tidak mengerjakan yang sudah kamu
        bisa. Tes ini hanya sekali.
      </p>
      <button
        type="button"
        disabled={sibuk}
        onClick={() => {
          setGalat(null)
          mulai(async () => {
            const hasil = await mulaiPenempatan(topikId, anak)
            if (hasil && 'error' in hasil) setGalat(hasil.error)
          })
        }}
        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        Kerjakan Tes Penempatan
      </button>
    </div>
  )
}
