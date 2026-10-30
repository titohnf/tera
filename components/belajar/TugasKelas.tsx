'use client'

import { useState, useTransition } from 'react'
import type { AsesmenAnak } from '@/lib/belajar/asesmen'
import { mulaiAsesmen } from '@/app/belajar/asesmen/actions'

const NAMA_JENIS: Record<AsesmenAnak['jenis'], string> = {
  asesmen: 'Asesmen',
  remedial: 'Remedial',
  tryout: 'Try out',
}

/**
 * Asesmen dari pertemuan kelas yang bisa dikerjakan di sini, bukan di Google
 * Form. Nilainya masuk ke catatan sesi otomatis; tutor tidak mengetiknya.
 */
export default function TugasKelas({
  tugas,
  anak,
  baruSelesai,
}: {
  tugas: AsesmenAnak[]
  anak: string
  baruSelesai: boolean
}) {
  const [galat, setGalat] = useState<string | null>(null)
  const [sibuk, mulai] = useTransition()

  if (tugas.length === 0) return null

  function kerjakan(id: string) {
    setGalat(null)
    mulai(async () => {
      const hasil = await mulaiAsesmen(id, anak)
      if (hasil?.error) setGalat(hasil.error)
    })
  }

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold text-gray-900">Tugas dari kelas</h2>
      {baruSelesai && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Asesmen terkirim. Nilainya sudah tercatat di sesi.
        </p>
      )}
      {galat && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">{galat}</p>
      )}
      <ul className="space-y-2">
        {tugas.map(t => (
          <li key={t.assessmentId} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-kartu">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{t.judul}</p>
              <p className="text-xs text-gray-500">
                {NAMA_JENIS[t.jenis]}
                {t.namaKelas ? ` · ${t.namaKelas}` : ''} ·{' '}
                {new Date(t.jadwal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ·{' '}
                {t.jumlahSoal} Soal
              </p>
              {!t.selesai && !t.bisaDikerjakan && t.alasan && (
                <p className="mt-0.5 text-xs text-amber-700">{t.alasan}</p>
              )}
            </div>
            {t.selesai ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {t.persen ?? 0}
              </span>
            ) : t.bisaDikerjakan ? (
              <button
                type="button"
                disabled={sibuk}
                onClick={() => kerjakan(t.assessmentId)}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {t.attemptId ? 'Lanjutkan' : 'Kerjakan'}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
