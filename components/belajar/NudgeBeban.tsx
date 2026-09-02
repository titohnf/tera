'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { catatNudge } from '@/app/belajar/actions'
import type { NudgeBeban as Nudge } from '@/lib/belajar/beban'

/**
 * Ajakan berhenti sehari, sesudah satu paket selesai (FR10).
 *
 * DUA TOMBOL, DAN KEDUANYA SUNGGUHAN. "Aku masih semangat" tidak membuka dialog
 * kedua, tidak memunculkan nudge lain, dan tidak dicatat sebagai apa pun selain
 * satu baris yang menegakkan batas dua-per-hari. Sistem yang terus menegur
 * sesudah ditolak sudah bukan menyarankan (dokumen fondasi Bagian 3.2).
 *
 * Kalimatnya menjelaskan KENAPA, bukan cuma menyuruh berhenti — anak yang paham
 * alasan sebuah jeda lebih mungkin menerimanya sukarela daripada anak yang cuma
 * diperintah. Teksnya datang dari database, bukan dari berkas ini.
 *
 * PENCATATANNYA DI SINI, saat kartunya benar-benar terpasang di layar — bukan
 * di komponen server yang menghitungnya. Halaman hasil bisa dirender ulang
 * beberapa kali (navigasi kembali, `?soal=`), dan mencatat di sana akan
 * menghabiskan jatah hari itu tanpa satu pun kalimat sampai ke anaknya.
 */
export default function NudgeBeban({
  nudge,
  kembali,
  anak,
}: {
  nudge: Nudge
  /** Beranda anak — tujuan "Lanjut besok". */
  kembali: string
  anak?: string
}) {
  const [tampil, setTampil] = useState(true)
  const dicatat = useRef(false)

  useEffect(() => {
    if (dicatat.current) return
    dicatat.current = true
    void catatNudge('formal', nudge.sinyal, anak)
  }, [nudge.sinyal, anak])

  if (!tampil) return null

  return (
    <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
      <p className="text-sm leading-relaxed text-amber-900">{nudge.pesan}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={kembali}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Lanjut besok
        </Link>
        <button
          type="button"
          onClick={() => setTampil(false)}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-kartu transition hover:bg-slate-50"
        >
          Aku masih semangat, lanjut dulu
        </button>
      </div>
    </div>
  )
}
