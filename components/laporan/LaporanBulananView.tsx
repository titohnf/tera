import type { ReactNode } from 'react'
import { KEHADIRAN } from '@/lib/kehadiran'
import type { LaporanBulananData, LaporanNote } from '@/lib/reports/laporan-bulanan'

/**
 * Badan laporan bulanan — satu tampilan, dipakai halaman admin maupun portal
 * keluarga.
 *
 * Sebelumnya hanya admin yang punya laporan sebenarnya; keluarga melihat menu
 * bernama sama yang isinya cuma tiga kolom ringkasan dari `monthly_report_notes`.
 * Nama yang sama untuk isi yang berbeda adalah cara tercepat membuat orang tua
 * dan admin berdebat tentang laporan yang mereka kira sama.
 *
 * Catatan performa tutor TIDAK lagi berdiri sebagai seksi tersendiri, dan
 * Materi serta Nilai Asesmen disajikan satu kartu per tanggal — asesmen lahir
 * dari satu sesi, jadi keduanya ditampilkan bersama di kartu tanggal yang
 * sama. Setiap kartu menutup dengan bagian "Rekomendasi" berisi komentar
 * tutor untuk sesi itu. PDF dihasilkan dari data yang sama dan sengaja tidak
 * menyertakannya.
 *
 * Yang berbeda antara kedua portal cuma dua hal, dan keduanya lewat prop:
 * tautan ke profil siswa (admin saja), dan bentuk "Catatan Tambahan" — formulir
 * yang bisa diisi admin, teks biasa untuk keluarga.
 */

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LaporanBulananView({
  report,
  profileHref,
  catatanTambahan,
}: {
  report: LaporanBulananData
  /** Tautan "lihat profil siswa"; kosongkan untuk portal keluarga. */
  profileHref?: string
  /** Formulir untuk admin, teks untuk keluarga. */
  catatanTambahan: ReactNode
}) {
  /* Komentar tutor per sesi ditampilkan sebagai bagian "Rekomendasi" di kartu
     tanggal sesi tersebut. */
  const notesBySession = new Map<string, LaporanNote[]>()
  for (const n of report.performanceNotes) {
    const ada = notesBySession.get(n.session_id) ?? []
    ada.push(n)
    notesBySession.set(n.session_id, ada)
  }

  /* Ringkasan kehadiran membaca terlambat sebagai hadir dan izin sebagai
     absen, supaya selalu berlaku Hadir + Absen = Total Sesi. */
  const totalSesi = report.attendanceSummary.total
  const hadir = report.attendanceSummary.present + report.attendanceSummary.late
  const absen = report.attendanceSummary.absent + report.attendanceSummary.excused

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{report.student.nickname ?? report.student.full_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.student.grade ? `Kelas ${report.student.grade}` : report.student.level ?? ''}
              {' · '}Periode {report.monthLabel}
            </p>
          </div>
          {profileHref && (
            <a href={profileHref} className="text-xs text-blue-600 hover:underline">
              Lihat profil siswa →
            </a>
          )}
        </div>
        {/* Kelas ("Grup ... Reguler · nama tutor") dan dua kolom kehadiran yang
            jarang dipakai sengaja dihapus: kartu ini satu kartu angka besar,
            bukan rekap detil kelas. Hadir sudah membungkus terlambat, Absen
            membungkus izin. */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-800">{totalSesi}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Sesi</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{hadir}</p>
            <p className="text-xs text-gray-400 mt-0.5">Hadir</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{absen}</p>
            <p className="text-xs text-gray-400 mt-0.5">Absen</p>
          </div>
        </div>
        {report.attendanceSummary.pct !== null && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Tingkat kehadiran:{' '}
            <span className="font-semibold text-gray-700">{report.attendanceSummary.pct}%</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Nilai</h2>
        {report.nilaiByMapel.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada nilai asesmen di bulan ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Mapel</th>
                <th className="pb-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Rata-rata</th>
                <th className="pb-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Tertinggi</th>
                <th className="pb-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Terendah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.nilaiByMapel.map(m => (
                <tr key={m.mapel}>
                  <td className="py-2.5 text-gray-700">{m.mapel}</td>
                  <td className="py-2.5 text-center font-semibold text-gray-900 tabular-nums">{m.rataRata}</td>
                  <td className="py-2.5 text-center text-gray-700 tabular-nums">{m.tertinggi}</td>
                  <td className="py-2.5 text-center text-gray-700 tabular-nums">{m.terendah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Materi &amp; Asesmen</h2>
        {report.sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada sesi terlaksana di bulan ini.</p>
        ) : (
          report.sessions.map(s => {
            const att = s.attendance_status ? KEHADIRAN[s.attendance_status] : null
            const asesmenSesi = report.assessments.filter(a => a.session_id === s.id)
            const sesiNotes = notesBySession.get(s.id) ?? []
            const catatanNonRekomendasi = sesiNotes.filter(n => n.category !== 'Recommendation')
            const catatanRekomendasi = sesiNotes.filter(n => n.category === 'Recommendation')
            return (
              <div key={s.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800">{formatDate(s.scheduled_at)}</p>
                    {att ? (
                      <span className={`shrink-0 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${att.cls}`}>{att.label}</span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-xs text-gray-300">Belum ditandai</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-gray-700">{s.subject_name ?? '—'}</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Materi</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {s.topic ?? s.custom_theme ?? <span className="font-normal text-gray-300">—</span>}
                    </p>
                    {s.custom_learning_outcomes && s.custom_learning_outcomes.length > 0 && (
                      <p className="text-xs text-gray-400">{s.custom_learning_outcomes.join(', ')}</p>
                    )}
                    {s.attitude_note && (
                      <p className="text-sm text-gray-600">{s.attitude_note}</p>
                    )}
                  </div>

                  {(asesmenSesi.length > 0 || catatanNonRekomendasi.length > 0) && (
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      {asesmenSesi.length > 0 && (
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Asesmen Kelas</p>
                      )}
                      {asesmenSesi.map(a => (
                        <p key={a.id} className="text-sm font-semibold text-gray-800 tabular-nums">
                          {a.score !== null ? <>{a.score} <span className="text-gray-400">/ {a.max_score}</span></> : <span className="text-gray-300">—</span>}
                        </p>
                      ))}
                      {catatanNonRekomendasi.map(n => (
                        <p key={n.id} className="text-sm text-gray-600 leading-relaxed">{n.body}</p>
                      ))}
                    </div>
                  )}

                  {catatanRekomendasi.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rekomendasi</p>
                      {catatanRekomendasi.map(n => (
                        <p key={n.id} className="text-sm text-gray-600 leading-relaxed">{n.body}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2">
                    <span className="text-xs text-gray-400">Tutor:</span>
                    <span className="text-xs font-medium text-gray-700">{s.tutor_name ?? '—'}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Catatan Tambahan</h2>
        {catatanTambahan}
      </div>
    </div>
  )
}
