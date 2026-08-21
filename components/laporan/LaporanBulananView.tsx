import type { ReactNode } from 'react'
import { KEHADIRAN } from '@/lib/kehadiran'
import { groupNotesByCategory, type LaporanBulananData } from '@/lib/reports/laporan-bulanan'

/**
 * Badan laporan bulanan — satu tampilan, dipakai halaman admin maupun portal
 * keluarga.
 *
 * Sebelumnya hanya admin yang punya laporan sebenarnya; keluarga melihat menu
 * bernama sama yang isinya cuma tiga kolom ringkasan dari `monthly_report_notes`.
 * Nama yang sama untuk isi yang berbeda adalah cara tercepat membuat orang tua
 * dan admin berdebat tentang laporan yang mereka kira sama.
 *
 * Catatan performa tutor tampil di sini, dan itu memang tempatnya: laporan
 * bulanan dibangun DARI catatan-catatan itu (`lib/reports/laporan-bulanan.ts`).
 * Menampilkannya lagi sebagai seksi tersendiri di halaman lain hanya akan
 * mengulang isi yang sama di dua tempat.
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
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{report.student.full_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.student.nickname && `${report.student.nickname} · `}
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
        {report.classes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {report.classes.map(c => (
              <span key={c.id} className="text-xs bg-slate-50 text-gray-600 px-2.5 py-1 rounded-full">
                {c.name}{c.tutor_name ? ` · ${c.tutor_name}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Kehadiran</h2>
        {/* Lima kolom di layar 375px menyisakan ~62px per kolom — persis selebar
            label terpanjangnya ("Terlambat"), jadi tidak ada ruang bernapas sama
            sekali. Tiga kolom di ponsel memberi ~103px. */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-800">{report.attendanceSummary.total}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Sesi</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{report.attendanceSummary.present}</p>
            <p className="text-xs text-gray-400 mt-0.5">Hadir</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-600">{report.attendanceSummary.late}</p>
            <p className="text-xs text-gray-400 mt-0.5">Terlambat</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{report.attendanceSummary.absent}</p>
            <p className="text-xs text-gray-400 mt-0.5">Absen</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-400">{report.attendanceSummary.excused}</p>
            <p className="text-xs text-gray-400 mt-0.5">Izin</p>
          </div>
        </div>
        {report.attendanceSummary.pct !== null && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Tingkat kehadiran:{' '}
            <span className="font-semibold text-gray-700">{report.attendanceSummary.pct}%</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 px-5 pt-4 pb-3">Materi &amp; Topik yang Diajarkan</h2>
        {report.sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada sesi terlaksana di bulan ini.</p>
        ) : (
          <>
          {/* Ponsel: satu sesi satu kartu. Kolom "Topik / Tema" memuat teks
              bebas dari tutor — tema, capaian pembelajaran, catatan attitude —
              yang di dalam sel tabel selebar ponsel akan terperas jadi satu
              lajur sempit. */}
          <div className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
            {report.sessions.map(s => {
              const att = s.attendance_status ? KEHADIRAN[s.attendance_status] : null
              return (
                <div key={s.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800">{formatDate(s.scheduled_at)}</p>
                    {att ? (
                      <span className={`shrink-0 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${att.cls}`}>{att.label}</span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap text-xs text-gray-300">Belum ditandai</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {s.topic ?? s.custom_theme ?? <span className="text-gray-300">—</span>}
                  </p>
                  {s.custom_learning_outcomes && s.custom_learning_outcomes.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{s.custom_learning_outcomes.join(', ')}</p>
                  )}
                  {s.attitude_note && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      <span className="font-medium text-gray-400">Attitude:</span> {s.attitude_note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t border-b bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topik / Tema</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.sessions.map(s => {
                  const att = s.attendance_status ? KEHADIRAN[s.attendance_status] : null
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.scheduled_at)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.topic ?? s.custom_theme ?? <span className="text-gray-300">—</span>}
                        {s.custom_learning_outcomes && s.custom_learning_outcomes.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{s.custom_learning_outcomes.join(', ')}</p>
                        )}
                        {s.attitude_note && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-medium text-gray-400">Attitude:</span> {s.attitude_note}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {att ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${att.cls}`}>{att.label}</span>
                        ) : (
                          <span className="text-xs text-gray-300">Belum ditandai</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 px-5 pt-4 pb-3">Nilai Asesmen</h2>
        {report.assessments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada asesmen di bulan ini.</p>
        ) : (
          <>
          {/* Ponsel: nilai naik ke atas sebagai angka besar. Kolom Feedback
              adalah teks bebas tutor dan bisa panjang; di sel tabel selebar
              ponsel ia jadi lajur satu-dua kata per baris. */}
          <div className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
            {report.assessments.map(a => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.scheduled_at)}</p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-base font-semibold text-gray-900 tabular-nums">
                    {a.score !== null ? <>{a.score} <span className="text-sm font-normal text-gray-400">/ {a.max_score}</span></> : <span className="text-gray-300">—</span>}
                  </p>
                </div>
                {a.feedback && <p className="text-sm text-gray-500 mt-1.5">{a.feedback}</p>}
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t border-b bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asesmen</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nilai</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.assessments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{a.title}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.scheduled_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {a.score !== null ? (
                        <span className="font-semibold">{a.score} / {a.max_score}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.feedback ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Catatan Performa Tutor</h2>
          <span className="text-xs text-gray-400">Tidak tampil di PDF</span>
        </div>
        {report.performanceNotes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada catatan performa di bulan ini.</p>
        ) : (
          <div className="border-t divide-y">
            {groupNotesByCategory(report.performanceNotes).map(({ category, notes }) => (
              <div key={category} className="px-5 py-4">
                {category !== '_' && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                )}
                <div className="space-y-3">
                  {notes.map(n => (
                    <div key={n.id}>
                      <p className="text-sm text-gray-800 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {n.tutor_name ?? 'Tutor'}{n.scheduled_at ? ` · ${formatDate(n.scheduled_at)}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Catatan Tambahan</h2>
        {catatanTambahan}
      </div>
    </div>
  )
}
