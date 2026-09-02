import type { StatusTopik } from '@/lib/pengukuran/tutor'

/**
 * Mesin keadaan topik seorang murid, dibaca tutor penanggung jawab (FR13).
 *
 * KATA, BUKAN ANGKA — dan itu yang membuat kartu ini boleh berdiri di sini
 * tanpa syarat tambahan. Yang menentukan `tuntas` adalah Skor Putaran 1, angka
 * yang tidak pernah menyeberang ke layar murid; yang menyeberang ke sini cuma
 * kesimpulannya, dan kesimpulan itu memang untuk dibaca orang dewasa yang
 * mendampingi.
 *
 * `terkunci` sengaja tidak diberi warna merah maupun ikon gembok. Di Tahap 0
 * tidak ada placement test, jadi prasyarat MEMBERI TAHU dan tidak memblokir
 * (migrasi 146) — sebuah topik terkunci di sini berarti "belum waktunya
 * ditawarkan", bukan "murid ini dilarang".
 */
const RUPA: Record<StatusTopik['status'], { label: string; kelas: string }> = {
  terkunci: { label: 'Belum waktunya', kelas: 'bg-slate-100 text-slate-600' },
  siap_dikerjakan: { label: 'Siap dikerjakan', kelas: 'bg-blue-50 text-blue-700' },
  sedang_dikerjakan: { label: 'Sedang dikerjakan', kelas: 'bg-indigo-50 text-indigo-700' },
  tuntas: { label: 'Tuntas', kelas: 'bg-emerald-50 text-emerald-700' },
  butuh_pengulangan: { label: 'Butuh pengulangan', kelas: 'bg-amber-50 text-amber-700' },
  eskalasi_tutor: { label: 'Perlu pendampingan', kelas: 'bg-rose-50 text-rose-700' },
}

export default function StatusTopikList({ status }: { status: StatusTopik[] }) {
  if (status.length === 0) return null

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow ring-1 ring-gray-900/5">
      {status.map(s => {
        const rupa = RUPA[s.status]
        return (
          <div key={s.topikId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{s.nama}</p>
              <p className="text-xs text-gray-400">
                {s.topikId} · sejak{' '}
                {new Date(s.sejak).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Penanda FR11: topik yang tetap tuntas tapi prasyaratnya gagal
                  retest. Berdiri di samping statusnya, bukan menggantikannya —
                  keduanya benar sekaligus. */}
              {s.perluVerifikasiUlang && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Perlu diperiksa ulang
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rupa.kelas}`}>
                {rupa.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
