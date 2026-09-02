'use client'

/**
 * Tabel jadwal & kehadiran untuk portal keluarga, dipakai di layar lebar.
 *
 * Versi ponsel kartu-caranya (`components/keluarga/SesiKartuList`) dipakai di
 * bawah `lg`. Komponen ini ada sebagai tabel yang selaras dengan keinginan
 * keluarga melihat semua informasi sesi langsung, tanpa membuka barisnya.
 *
 * Berbeda dari `components/siswa/JadwalTable` yang dipakai admin: di sini baris
 * sesi TIDAK bisa dibuka untuk menampilkan rincian (tema, CP, materi, asesmen,
 * nilai, catatan tutor). Informasi yang terlihat adalah yang ada di kartu
 * ponsel — tanggal, jam, mapel, tutor, dan kehadiran — jadi kedua bentuknya
 * konsisten, tidak ada yang lebih kaya dan yang lebih miskin.
 *
 * Setiap sesi dikelompokkan per kelas dengan banner yang bisa dilipat, persis
 * seperti versi admin — kelas yang sudah selesai ditaruh terlipat supaya tidak
 * menghalangi yang aktif.
 */

import { useState, Fragment } from 'react'
import { KEHADIRAN, sorotBaris } from '@/lib/kehadiran'
import { stripClassUniqueTag } from '@/lib/format-class-name'

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
}

interface Props {
  sessions: Session[]
  enrolledClasses: EnrolledClass[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
}

function ClassSessionTable({
  cls,
  sessions,
  subjectNameMap,
  attendanceMap,
  sessionTutorMap,
}: {
  cls: EnrolledClass
  sessions: Session[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
}) {
  const [collapsed, setCollapsed] = useState<boolean>(!cls.is_active)
  const [selectedMapel, setSelectedMapel] = useState<string>('')
  const [selectedBulan, setSelectedBulan] = useState<string>('')
  const [urutan, setUrutan] = useState<'terbaru' | 'terlama'>('terlama')

  const getSubjectName = (s: Session): string =>
    (s.subject_id && subjectNameMap[s.subject_id]) ? subjectNameMap[s.subject_id] : ''

  const mapelOptions = Array.from(
    new Set(sessions.map(getSubjectName).filter(n => !!n)),
  ).sort()

  const bulanOptions = Array.from(new Set(sessions.map(s => bulanWib(s.scheduled_at)))).sort()

  const filteredSessions = sessions
    .filter(s => {
      const mapelMatch = !selectedMapel || getSubjectName(s) === selectedMapel
      const bulanMatch = !selectedBulan || bulanWib(s.scheduled_at) === selectedBulan
      return mapelMatch && bulanMatch
    })
    .slice()
    .sort((a, b) =>
      urutan === 'terbaru'
        ? b.scheduled_at.localeCompare(a.scheduled_at)
        : a.scheduled_at.localeCompare(b.scheduled_at),
    )

  const selectCls = "text-sm text-gray-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

  const completedCount = sessions.filter(s => s.status === 'completed').length
  const hadirCount = sessions.filter(s => {
    const st = attendanceMap[s.id]
    return st === 'present' || st === 'late'
  }).length
  const hadirPct = completedCount > 0 ? Math.round((hadirCount / completedCount) * 100) : null

  return (
    <div className="space-y-3">
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
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-gray-700">Sesi Kelas</h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {bulanOptions.length > 1 && (
              <select
                value={selectedBulan}
                onChange={e => { setSelectedBulan(e.target.value) }}
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
                onChange={e => { setSelectedMapel(e.target.value) }}
                className={selectCls}
              >
                <option value="">Semua Mapel</option>
                {mapelOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
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
                  onClick={() => setUrutan(u => (u === 'terlama' ? 'terbaru' : 'terlama'))}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm text-gray-400">
                  Tidak ada sesi di periode ini.
                </td>
              </tr>
            ) : filteredSessions.map((s, idx) => {
              const dt = new Date(s.scheduled_at)
              const attendance = attendanceMap[s.id]
              const attendanceSt = attendance
                ? (KEHADIRAN[attendance] ?? { label: attendance, cls: 'bg-gray-100 text-gray-500' })
                : null
              const sorot = sorotBaris(s.status, attendance)

              return (
                <tr
                  key={s.id}
                  id={`sesi-${s.id}`}
                  className={`border-l-[3px] ${sorot.garis}`}
                >
                  <td className="pl-4 pr-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${s.status === 'cancelled' ? 'text-red-500' : 'text-gray-700'}`}>
                    {dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate">{getSubjectName(s) || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell truncate">
                    {sessionTutorMap[s.id]?.split(' ')[0] ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'cancelled'
                      ? <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Dibatalkan</span>
                      : attendanceSt
                        ? <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${attendanceSt.cls}`}>{attendanceSt.label}</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>}
    </div>
  )
}

export default function SesiTable({ sessions, enrolledClasses, subjectNameMap, attendanceMap, sessionTutorMap }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Belum ada sesi.</p>
  }

  const classesWithSessions = enrolledClasses.filter(cls =>
    sessions.some(s => s.class_id === cls.id),
  )

  if (classesWithSessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Belum ada sesi.</p>
  }

  return (
    <div className="space-y-3">
      {classesWithSessions.map((cls) => (
        <ClassSessionTable
          key={cls.id}
          cls={cls}
          sessions={sessions.filter(s => s.class_id === cls.id)}
          subjectNameMap={subjectNameMap}
          attendanceMap={attendanceMap}
          sessionTutorMap={sessionTutorMap}
        />
      ))}
    </div>
  )
}
