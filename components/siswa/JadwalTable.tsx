'use client'

/**
 * Tabel jadwal & kehadiran murid, dipakai halaman detail siswa admin DAN beranda
 * anak di portal keluarga.
 *
 * Dulu tinggal di `components/admin/siswa/`, dan itu menyesatkan begitu portal
 * keluarga ikut memakainya: pembaca berikutnya akan mengira ini layar admin dan
 * mengubahnya tanpa sadar sedang mengubah apa yang dilihat orang tua. Yang
 * khusus admin sekarang cuma `showAdminLinks`.
 */

import { useState, useTransition, Fragment } from 'react'
import { getJadwalSessionDetail, type JadwalSessionDetail } from '@/lib/actions/jadwal'
import { KEHADIRAN, sorotBaris } from '@/lib/kehadiran'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import RincianSesi from '@/components/siswa/RincianSesi'

/**
 * Kalimat pembatalan yang dibaca orang tua.
 *
 * Alasan dari kalender libur sudah berupa frasa utuh ("Libur Nasional —
 * Proklamasi Kemerdekaan", lihat cancelSessionsOnHoliday), jadi satu aturan
 * cukup untuk libur maupun alasan lain — tidak perlu mendeteksi "libur" secara
 * khusus. Yang tidak punya alasan sama sekali adalah pembatalan manual dari
 * masa sebelum migrasi 090, atau yang memang dikosongkan adminnya.
 */
function alasanBatal(alasan: string | null | undefined): string {
  const teks = alasan?.trim()
  return teks ? `Dibatalkan karena ${teks}` : 'Dibatalkan oleh Admin'
}

/**
 * Bulan sebuah sesi menurut WIB, bukan UTC.
 *
 * `scheduled_at` disimpan UTC. Sesi sore hari aman diiris apa adanya, tapi sesi
 * pagi (00:00–06:59 WIB) jatuh di tanggal UTC sebelumnya — dan kalau itu tanggal
 * 1, sesinya masuk ke bulan yang salah di penyaring ini. Pola geseran +7 jam
 * yang sama dipakai di lib/actions/admin/holidays.ts.
 */
function bulanWib(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

function namaBulan(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type Session = {
  id: string
  /** Diisi sejak migrasi 090; kalender libur mengisinya otomatis. */
  cancellation_reason?: string | null
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
}

type EnrolledClass = {
  id: string
  name: string | null
  is_active: boolean
  subject_name: string | null
  tutor: { full_name: string } | null
}


interface Props {
  /** Jam server, untuk menentukan "Jadwal berikutnya". Lihat lib/waktu.ts. */
  sekarangIso?: string
  /** Tautan "kelola sesi" hanya berarti untuk admin; keluarga tidak punya
   *  halaman itu dan akan dipulangkan proxy kalau menekannya. */
  showAdminLinks?: boolean
  sessions: Session[]
  enrolledClasses: EnrolledClass[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
  studentId: string
}


interface ClassTableProps {
  sekarangIso?: string
  showAdminLinks?: boolean
  cls: EnrolledClass
  sessions: Session[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
  studentId: string
}

function ClassSessionTable({ sekarangIso, showAdminLinks, cls, sessions, subjectNameMap, attendanceMap, sessionTutorMap, studentId }: ClassTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailMap, setDetailMap] = useState<Record<string, JadwalSessionDetail | null>>({})
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState<boolean>(!cls.is_active)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedMapel, setSelectedMapel] = useState<string>('')
  const [selectedBulan, setSelectedBulan] = useState<string>('')
  // Terlama dulu: baris 1 adalah sesi paling awal, sehingga nomor barisnya
  // terbaca sebagai "pertemuan ke-berapa" — bukan hitungan mundur dari sesi
  // terakhir yang berubah arti tiap kali ada sesi baru.
  const [urutan, setUrutan] = useState<'terbaru' | 'terlama'>('terlama')

  const getSubjectNameRaw = (s: Session): string =>
    (s.subject_id && subjectNameMap[s.subject_id])
      ? subjectNameMap[s.subject_id]
      : (cls.subject_name ?? '')

  const getSubjectName = getSubjectNameRaw

  const mapelOptions = Array.from(
    new Set(sessions.map(getSubjectName).filter(n => !!n))
  ).sort()

  const bulanOptions = Array.from(new Set(sessions.map(s => bulanWib(s.scheduled_at)))).sort()

  const filteredSessions = sessions
    .filter(s => {
      const statusMatch = !selectedStatus || s.status === selectedStatus
      const mapelMatch = !selectedMapel || getSubjectName(s) === selectedMapel
      const bulanMatch = !selectedBulan || bulanWib(s.scheduled_at) === selectedBulan
      return statusMatch && mapelMatch && bulanMatch
    })
    // Disalin dulu: `sessions` milik pemanggil, dan mengurutkannya di tempat
    // akan mengacak nomor baris di render berikutnya.
    .slice()
    .sort((a, b) =>
      urutan === 'terbaru'
        ? b.scheduled_at.localeCompare(a.scheduled_at)
        : a.scheduled_at.localeCompare(b.scheduled_at),
    )

  /**
   * Membuka satu sesi dari luar tabel dan menggulir ke barisnya.
   *
   * Berbeda dari klik baris biasa, ini tidak pernah menutup: yang menekan
   * "Lihat detail sesi" bermaksud melihatnya, bukan menyembunyikannya. Kelas
   * yang sedang terlipat dibuka, dan penyaring yang kebetulan menyembunyikan
   * sesi itu dikembalikan ke "Semua" — kalau tidak, tombolnya menggulir ke
   * baris yang tidak ada dan terasa rusak.
   */
  function bukaDanGulir(sessionId: string) {
    setCollapsed(false)

    const sesi = sessions.find(x => x.id === sessionId)
    if (sesi) {
      if (selectedStatus && sesi.status !== selectedStatus) setSelectedStatus('')
      if (selectedMapel && getSubjectName(sesi) !== selectedMapel) setSelectedMapel('')
    }

    setExpandedId(sessionId)
    muatDetail(sessionId)

    // Menunggu satu frame supaya barisnya sudah benar-benar dirender sebelum
    // digulir — kelas yang baru dibuka belum ada di DOM saat ini.
    requestAnimationFrame(() => {
      document
        .getElementById(`sesi-${sessionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  /** Mengambil detail satu sesi kalau belum pernah diambil. */
  function muatDetail(sessionId: string) {
    if (sessionId in detailMap) return
    setLoadingId(sessionId)
    startTransition(async () => {
      try {
        const detail = await getJadwalSessionDetail(sessionId, studentId)
        setDetailMap(prev => ({ ...prev, [sessionId]: detail }))
      } catch {
        setDetailMap(prev => ({ ...prev, [sessionId]: null }))
      } finally {
        setLoadingId(null)
      }
    })
  }

  function handleRowClick(sessionId: string) {
    if (expandedId === sessionId) { setExpandedId(null); return }
    setExpandedId(sessionId)
    muatDetail(sessionId)
  }

  const selectCls = "text-sm text-gray-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

  const completedSessions = sessions.filter(s => s.status === 'completed')
  const completedCount = completedSessions.length
  const hadirCount = completedSessions.filter(s => {
    const st = attendanceMap[s.id]
    return st === 'present' || st === 'late'
  }).length
  const hadirPct = completedCount > 0 ? Math.round((hadirCount / completedCount) * 100) : null

  // Sesi terdekat yang belum lewat. `sekarangIso` datang dari server (lihat
  // lib/waktu.ts) supaya perbandingannya murni dan hasil render server sama
  // dengan hasil hidrasi di browser.
  const sesiBerikutnya = sekarangIso
    ? sessions
        .filter(s => s.status !== 'cancelled' && s.scheduled_at >= sekarangIso)
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null
    : null

  return (
    <div className="space-y-3">
      {/* -mx-5/-mt-5 membatalkan padding kartu pembungkusnya (p-5 di kedua
          halaman) supaya banner ini melebar penuh sampai tepi kartu. */}
      {sesiBerikutnya && (
        <div className="-mx-5 -mt-5 mb-4 flex items-center justify-between gap-3 flex-wrap border-b border-blue-100 bg-blue-50/60 px-5 py-5">
          <div className="flex items-start gap-2">
            {/* Titik diletakkan di luar kolom teks — kalau ia ikut di dalam
                baris label, tanggal di bawahnya jadi tidak sejajar dengan
                tulisan "Jadwal berikutnya". */}
            <span className="relative mt-1 flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Jadwal berikutnya
            </p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {new Date(sesiBerikutnya.scheduled_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {', '}
              {new Date(sesiBerikutnya.scheduled_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {getSubjectName(sesiBerikutnya) && (
                <span className="text-gray-500"> · {getSubjectName(sesiBerikutnya)}</span>
              )}
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => bukaDanGulir(sesiBerikutnya.id)}
            className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Lihat detail sesi
          </button>
        </div>
      )}

      {/* Banner kelas dan tabelnya satu kesatuan: tabel selebar banner, ditarik
          naik (-mt-4) dan diberi z-10 sehingga ia yang menimpa — tepi atasnya
          menjorok sedikit ke bagian bawah banner. Karena itu banner diberi ruang
          bawah lebih (pb-7) saat terbuka, supaya tulisannya tidak tertutup. */}
      <div>
      {/* Class name toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full px-4 pt-3 border border-slate-200! rounded-xl bg-white hover:bg-slate-50 transition-colors ${collapsed ? 'pb-3' : 'pb-7'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-start min-w-0">
            <span className={`text-sm font-semibold truncate ${cls.is_active ? 'text-gray-800' : 'text-gray-500'}`}>
              {stripClassUniqueTag(cls.name ?? '')}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedCount} Terlaksana
              {hadirPct !== null && <> · {hadirCount} Hadir ({hadirPct}%)</>}
            </p>
          </div>
          <svg className={`w-4 h-4 shrink-0 transition-transform text-gray-400 ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && <div className="relative z-10 -mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Judul di kiri, penyaring di kanan */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-gray-700">Sesi Kelas</h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {bulanOptions.length > 1 && (
              <select
                value={selectedBulan}
                onChange={e => { setSelectedBulan(e.target.value); setExpandedId(null) }}
                className={selectCls}
              >
                <option value="">Semua Bulan</option>
                {bulanOptions.map(b => (
                  <option key={b} value={b}>{namaBulan(b)}</option>
                ))}
              </select>
            )}
            {mapelOptions.length > 0 && (
              <select
                value={selectedMapel}
                onChange={e => { setSelectedMapel(e.target.value); setExpandedId(null) }}
                className={selectCls}
              >
                <option value="">Semua Mapel</option>
                {mapelOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setExpandedId(null) }}
              className={selectCls}
            >
              <option value="">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="scheduled">Terjadwal</option>
              <option value="ongoing">Berlangsung</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="w-8 pl-4 pr-3 py-3 text-left">No</th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setUrutan(u => (u === 'terlama' ? 'terbaru' : 'terlama'))
                    setExpandedId(null)
                  }}
                  title={urutan === 'terlama' ? 'Terlama dulu — klik untuk membalik' : 'Terbaru dulu — klik untuk membalik'}
                  className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700 transition-colors"
                >
                  Tanggal
                  <svg
                    className={`w-3 h-3 transition-transform ${urutan === 'terbaru' ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left">Jam</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Mapel</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Tutor</th>
              <th className="px-4 py-3 text-left">Keterangan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-sm text-gray-400">
                  Tidak ada sesi di periode ini.
                </td>
              </tr>
            ) : filteredSessions.map((s, idx) => {
              const dt = new Date(s.scheduled_at)
              // Sesi yang dibatalkan tidak pernah punya baris kehadiran, jadi
              // dulu ia jatuh ke "—": barisnya merah tanpa menerangkan kenapa.
              // Statusnya sendiri yang jadi keterangannya.
              const attendance = attendanceMap[s.id]
              const attendanceSt = attendance
                ? (KEHADIRAN[attendance] ?? { label: attendance, cls: 'bg-gray-100 text-gray-500' })
                : null
              const isExpanded = expandedId === s.id
              const isLoading = loadingId === s.id
              const detail = detailMap[s.id]
              const sorot = sorotBaris(s.status, attendance)

              return (
                <Fragment key={s.id}>
                  <tr
                    id={`sesi-${s.id}`}
                    onClick={() => handleRowClick(s.id)}
                    className={`cursor-pointer transition-colors ${
                      isExpanded
                        ? `font-medium [&>td]:text-gray-900 [&>td]:border-t border-b [&>td:last-child]:border-r ${sorot.baris}`
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`pl-4 pr-3 py-3 text-gray-400 text-xs border-l-[3px] ${isExpanded ? sorot.garis : 'border-l-transparent'}`}>{idx + 1}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${s.status === 'cancelled' ? 'text-red-500' : 'text-gray-700'}`}>
                      {dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate">{getSubjectName(s) || '—'}</td>
                    <td
                      className="px-4 py-3 text-gray-500 hidden md:table-cell truncate"
                      title={sessionTutorMap[s.id] ?? cls.tutor?.full_name ?? undefined}
                    >
                      {(sessionTutorMap[s.id] ?? cls.tutor?.full_name)?.split(' ')[0] ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === 'cancelled'
                        ? <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Dibatalkan</span>
                        : attendanceSt
                          ? <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${attendanceSt.cls}`}>{attendanceSt.label}</span>
                          : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="pr-4 pl-2 py-3">
                      <div className="flex justify-end">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className={`bg-white p-0 border-l-[3px] border-t border-b border-r ${sorot.panel}`}>
                        <div className="pl-3 pr-4 py-3">
                          {/* `undefined` berarti belum pernah diambil, `null`
                              berarti pengambilannya gagal. Keduanya harus
                              ditangkap sebelum isinya dibaca — dulu hanya `null`
                              yang diperiksa, jadi baris yang terbuka sebelum
                              detailnya sempat masuk melempar
                              "Cannot read properties of undefined". */}
                          {s.status === 'cancelled' && (
                            <p className="text-sm text-red-500 pb-2">{alasanBatal(s.cancellation_reason)}</p>
                          )}
                          {isLoading ? (
                            <p className="text-sm text-gray-400 py-1">Memuat...</p>
                          ) : (
                            <RincianSesi
                              anakId={studentId}
                              detail={detail}
                              sessionId={s.id}
                              topikSesi={s.topic}
                              showAdminLinks={showAdminLinks}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>}
      </div>
    </div>
  )
}

export default function JadwalTable({ sekarangIso, showAdminLinks = false, sessions, enrolledClasses, subjectNameMap, attendanceMap, sessionTutorMap, studentId }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Belum ada sesi.</p>
  }

  const classesWithSessions = enrolledClasses.filter(cls =>
    sessions.some(s => s.class_id === cls.id)
  )

  if (classesWithSessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Belum ada sesi.</p>
  }

  return (
    <div className="space-y-3">
      {classesWithSessions.map((cls) => (
        <div key={cls.id}>
          <ClassSessionTable
            sekarangIso={sekarangIso}
            showAdminLinks={showAdminLinks}
            cls={cls}
            sessions={sessions.filter(s => s.class_id === cls.id)}
            subjectNameMap={subjectNameMap}
            attendanceMap={attendanceMap}
            sessionTutorMap={sessionTutorMap}
            studentId={studentId}
          />
        </div>
      ))}
    </div>
  )
}
