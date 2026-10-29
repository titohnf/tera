'use client'

import { useMemo, useState, useTransition } from 'react'
import type { SoalLatihan } from '@/lib/belajar/tipe-soal'
import type { SoalSesi } from '@/lib/belajar/sesi'
import { acakOpsi } from '@/lib/belajar/acak-opsi'
import { kirimAsesmen, simpanJawabanAsesmen } from '@/app/belajar/asesmen/actions'
import InputSoal from './InputSoal'

/**
 * Mengerjakan satu asesmen sesi: satu soal sekaligus, tanpa umpan balik per
 * soal, nilai dibuka di akhir.
 *
 * Lebih sederhana dari `PelariSesi` dengan sengaja: asesmen tidak punya jejak
 * waktu per butir, nudge istirahat, atau paket berputar. Yang sama hanya hal
 * yang memang harus sama — widget jawabnya (`InputSoal`) dan pengacakan opsi.
 *
 * Tiap jawaban dicatat sebelum maju, jadi menutup tab di tengah jalan tidak
 * menghilangkan apa pun; dimulai dari soal pertama yang belum dijawab. Kunci
 * jawaban tidak pernah ada di sini, dan penilaian terjadi di database.
 */
export default function PelariAsesmen({
  attemptId,
  soal,
  tersimpan,
  anak,
}: {
  attemptId: string
  soal: SoalLatihan[]
  tersimpan: Record<string, unknown>
  anak?: string
}) {
  const [indeks, setIndeks] = useState(() =>
    Math.max(soal.findIndex(s => !(s.id in tersimpan)), 0)
  )
  const [jawaban, setJawaban] = useState<unknown>(undefined)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  const sekarang = soal[indeks]
  const terakhir = indeks + 1 >= soal.length

  const tampil = useMemo(() => {
    const { soal: s } = acakOpsi(sekarang, `${attemptId}:${sekarang.id}`)
    // InputSoal meminta bentuk SoalSesi; bagian keadaan sesinya tidak dipakai di sini.
    return { ...s, sudahDijawab: false, benar: null, skor: null, skorMaks: null } as SoalSesi
  }, [sekarang, attemptId])

  function lanjut() {
    setGalat(null)
    mulai(async () => {
      const ok = await simpanJawabanAsesmen(attemptId, sekarang.id, jawaban ?? null)
      if (!ok) {
        setGalat('Jawabanmu belum tersimpan. Coba tekan sekali lagi.')
        return
      }
      if (!terakhir) {
        setIndeks(indeks + 1)
        setJawaban(undefined)
        return
      }
      const hasil = await kirimAsesmen(attemptId, anak)
      if (hasil?.error) setGalat(hasil.error)
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
        <InputSoal key={sekarang.id} soal={tampil} nilai={jawaban} onChange={setJawaban} />
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
        {sibuk ? 'Menyimpan…' : terakhir ? 'Kirim Asesmen' : 'Lanjut'}
      </button>
    </div>
  )
}
