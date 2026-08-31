'use client'

import { useState, useTransition } from 'react'
import type { SoalSesi } from '@/lib/belajar/sesi'
import { periksaJawaban, selesaikanLatihan } from '@/app/belajar/actions'
import InputSoal from './InputSoal'

/**
 * Mengerjakan satu sesi: satu soal sekaligus, sampai habis, baru nilainya.
 *
 * TIDAK ADA umpan balik per soal, dan itu berubah dengan sengaja. Dulu tiap
 * jawaban langsung dibalas "Benar"/"Belum tepat" beserta pembahasannya, dan
 * bentuk itu punya dua akibat yang baru terlihat setelah dipakai: anak
 * mengerjakan sepuluh soal sambil terus-menerus diberi tahu jawabannya, jadi
 * tidak pernah ada satu titik pun ia menghadapi sepuluh soal dengan kepalanya
 * sendiri; dan kesempatan MENGERJAKAN ULANG soal yang salah jadi tidak ada
 * artinya, karena kuncinya sudah lewat di layar.
 *
 * Sekarang sepuluh soal dikerjakan tanpa balasan, nilainya dibuka di akhir, dan
 * kuncinya baru sesudah anaknya memilih untuk melihatnya. Lihat
 * `PilihanSesudahSkor`.
 *
 * Jawabannya tetap DICATAT satu per satu, tidak ditumpuk sampai akhir: sesi
 * yang ditinggalkan di tengah harus bisa dilanjutkan dari tempatnya berhenti
 * (migrasi 114), dan itu cuma mungkin kalau tiap jawaban sudah mendarat di
 * database. Yang ditahan cuma HASILNYA, di layar.
 *
 * Dimulai dari soal PERTAMA YANG BELUM DIJAWAB, bukan dari soal pertama:
 * anak yang menutup tab di soal keenam membukanya lagi di soal keenam.
 *
 * Penilaian tidak pernah terjadi di sini. `periksaJawaban` mengambil kuncinya
 * di server, jadi kunci jawaban tidak pernah ada di dalam bundel yang dikirim
 * ke browser — termasuk untuk soal yang belum dijawab.
 */
export default function PelariSesi({
  sesiId,
  soal,
}: {
  sesiId: string
  soal: SoalSesi[]
}) {
  const mulaiDari = Math.max(
    soal.findIndex(s => !s.sudahDijawab),
    0
  )
  const [indeks, setIndeks] = useState(mulaiDari)
  const [jawaban, setJawaban] = useState<unknown>(undefined)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  const sekarang = soal[indeks]
  const terakhir = indeks + 1 >= soal.length

  /**
   * Mencatat jawaban lalu maju. Hasil penilaiannya dibuang di sini dengan
   * sengaja — yang dibutuhkan cuma kepastian bahwa jawabannya TERCATAT, dan
   * null dari server berarti tidak tercatat.
   */
  function lanjut() {
    setGalat(null)
    mulai(async () => {
      const tercatat = await periksaJawaban(sesiId, sekarang.id, jawaban ?? null)
      if (!tercatat) {
        setGalat('Jawabanmu belum tersimpan. Coba tekan sekali lagi.')
        return
      }
      if (!terakhir) {
        setIndeks(indeks + 1)
        setJawaban(undefined)
        return
      }
      await selesaikanLatihan(sesiId)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-gray-700">
            Soal {indeks + 1} dari {soal.length}
          </p>
          <p className="text-xs text-gray-400">{Math.round((indeks / soal.length) * 100)}%</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${(indeks / soal.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <InputSoal soal={sekarang} nilai={jawaban} onChange={setJawaban} />
      </div>

      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      <button
        type="button"
        disabled={sibuk || jawaban === undefined}
        onClick={lanjut}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {sibuk ? 'Menyimpan…' : terakhir ? 'Selesai & Lihat Nilai' : 'Lanjut'}
      </button>
    </div>
  )
}

