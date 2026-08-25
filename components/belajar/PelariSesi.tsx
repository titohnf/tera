'use client'

import { useState, useTransition } from 'react'
import type { HasilJawab, SoalSesi } from '@/lib/belajar/sesi'
import { periksaJawaban, selesaikanLatihan } from '@/app/belajar/actions'
import InputSoal from './InputSoal'
import RumusTeks from './RumusTeks'

/**
 * Mengerjakan satu sesi: satu soal sekaligus, umpan balik seketika, lalu lanjut.
 *
 * Dimulai dari soal PERTAMA YANG BELUM DIJAWAB, bukan dari soal pertama.
 * Itulah gunanya sesi disimpan (migrasi 114): anak yang menutup tab di soal
 * keenam membukanya lagi di soal keenam, bukan mengulang dari awal atau
 * mendapat undian yang sama sekali berbeda.
 *
 * Penilaian tidak pernah terjadi di sini. `periksaJawaban` mengambil kuncinya
 * di server dan hanya memulangkan hasilnya, jadi kunci jawaban tidak pernah ada
 * di dalam bundel yang dikirim ke browser — termasuk untuk soal yang belum
 * dijawab.
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
  const [hasil, setHasil] = useState<HasilJawab | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  const sekarang = soal[indeks]
  const terakhir = indeks + 1 >= soal.length

  function periksa() {
    setGalat(null)
    mulai(async () => {
      const nilai = await periksaJawaban(sesiId, sekarang.id, jawaban ?? null)
      if (!nilai) {
        setGalat('Jawabanmu belum tersimpan. Coba tekan sekali lagi.')
        return
      }
      setHasil(nilai)
    })
  }

  function lanjut() {
    if (!terakhir) {
      setIndeks(indeks + 1)
      setJawaban(undefined)
      setHasil(null)
      return
    }
    mulai(async () => {
      await selesaikanLatihan(sesiId)
    })
  }

  const selesai = indeks + (hasil ? 1 : 0)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-gray-700">
            Soal {indeks + 1} dari {soal.length}
          </p>
          <p className="text-xs text-gray-400">{Math.round((selesai / soal.length) * 100)}%</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${(selesai / soal.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <InputSoal
          soal={sekarang}
          nilai={jawaban}
          onChange={setJawaban}
          terkunci={hasil !== null}
        />
      </div>

      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {galat}
        </p>
      )}

      {hasil ? (
        <>
          <div
            className={`rounded-xl p-4 ring-1 ${
              hasil.benar
                ? 'bg-emerald-50 text-emerald-900 ring-emerald-100'
                : hasil.skor > 0
                  ? 'bg-amber-50 text-amber-900 ring-amber-100'
                  : 'bg-rose-50 text-rose-900 ring-rose-100'
            }`}
          >
            <p className="text-sm font-semibold">
              {hasil.benar
                ? 'Benar'
                : hasil.skor > 0
                  ? `Sebagian benar — ${bulat(hasil.skor)} dari ${bulat(hasil.skorMaks)}`
                  : 'Belum tepat'}
            </p>
            {hasil.pembahasan && (
              <div className="mt-2 text-sm leading-relaxed">
                <RumusTeks text={hasil.pembahasan} />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={sibuk}
            onClick={lanjut}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
          >
            {terakhir ? 'Selesai & Lihat Hasil' : 'Lanjut'}
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={sibuk || jawaban === undefined}
          onClick={periksa}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
        >
          {sibuk ? 'Memeriksa…' : 'Periksa Jawaban'}
        </button>
      )}
    </div>
  )
}

/** Skor parsial bisa pecahan panjang (bobot 3 dibagi 7 pernyataan). Dibulatkan untuk dibaca. */
function bulat(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
