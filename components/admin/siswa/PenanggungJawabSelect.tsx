'use client'

import { useState, useTransition } from 'react'
import { setPenanggungJawabSiswa } from '@/lib/actions/admin/penanggung-jawab'

export type TutorPilihan = { id: string; full_name: string }

/**
 * Pilihan tutor penanggung jawab di halaman detail siswa. Hasil dari
 * `setPenanggungJawabSiswa` — lihat di sana mengapa kolom ini tidak boleh
 * dikosongkan tanpa sadar.
 */
export default function PenanggungJawabSelect({
  studentId,
  nilaiAwal,
  tutor,
}: {
  studentId: string
  nilaiAwal: string | null
  tutor: TutorPilihan[]
}) {
  const [nilai, setNilai] = useState(nilaiAwal ?? '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function ubah(baru: string) {
    const lama = nilai
    setNilai(baru)
    setError('')
    startTransition(async () => {
      const hasil = await setPenanggungJawabSiswa(studentId, baru || null)
      if (hasil?.error) {
        setNilai(lama)
        setError(hasil.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Tutor Penanggung Jawab</h2>
      <p className="text-xs text-gray-500 mb-3">
        Menerima eskalasi saat siswa kesulitan di latihan. Wajib terisi agar siswa bisa membuka
        paket pengukuran.
      </p>
      <select
        value={nilai}
        disabled={pending}
        onChange={e => ubah(e.target.value)}
        className="w-full rounded-lg border-slate-200 text-sm disabled:opacity-60"
      >
        <option value="">Belum ditetapkan</option>
        {tutor.map(t => (
          <option key={t.id} value={t.id}>
            {t.full_name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
