'use client'

import { useState, useTransition, Fragment } from 'react'
import Link from 'next/link'
import { getJadwalSessionDetail, type JadwalSessionDetail } from '@/lib/actions/admin/jadwal'

const COMPREHENSION_LEVELS: Record<string, { label: string; bg: string; text: string }> = {
  L0: { label: 'L0: Tidak Paham Sama Sekali',     bg: 'bg-red-200',    text: 'text-red-900' },
  L1: { label: 'L1: Paham Permukaan/Hafalan',      bg: 'bg-orange-200', text: 'text-orange-900' },
  L2: { label: 'L2: Paham Konsep Dasar',           bg: 'bg-yellow-200', text: 'text-yellow-900' },
  L3: { label: 'L3: Paham Pengaplikasian Konsep',  bg: 'bg-green-200',  text: 'text-green-900' },
  L4: { label: 'L4: Sangat Paham',                 bg: 'bg-blue-200',   text: 'text-blue-900' },
  L5: { label: 'L5: Mahir',                        bg: 'bg-purple-200', text: 'text-purple-900' },
}

type Session = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
}

type EnrolledClass = {
  id: string
  subject_name: string | null
  tutor: { full_name: string } | null
}

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir',     cls: 'bg-green-100 text-green-700' },
  late:    { label: 'Terlambat', cls: 'bg-yellow-100 text-yellow-700' },
  absent:  { label: 'Absen',     cls: 'bg-red-100 text-red-600' },
  excused: { label: 'Izin',      cls: 'bg-gray-100 text-gray-500' },
}

interface Props {
  sessions: Session[]
  enrolledClasses: EnrolledClass[]
  attendanceMap: Record<string, string>
  studentId: string
}

function getSemesterKey(date: Date): string {
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return m >= 7 ? `1-${y}` : `2-${y}`
}

function getSemesterLabel(key: string): string {
  const [sem, year] = key.split('-')
  const y = parseInt(year)
  return sem === '1' ? `Semester 1 — ${y}/${y + 1}` : `Semester 2 — ${y - 1}/${y}`
}

export default function JadwalTable({ sessions, enrolledClasses, attendanceMap, studentId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailMap, setDetailMap] = useState<Record<string, JadwalSessionDetail | null>>({})
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const semesterKeys = Array.from(
    new Set(sessions.map(s => getSemesterKey(new Date(s.scheduled_at))))
  ).sort().reverse()

  const [selectedSemester, setSelectedSemester] = useState<string>(semesterKeys[0] ?? '')
  const [selectedMapel, setSelectedMapel] = useState<string>('')

  const mapelOptions = Array.from(
    new Set(
      sessions
        .map(s => enrolledClasses.find(c => c.id === s.class_id)?.subject_name)
        .filter((n): n is string => !!n)
    )
  ).sort()

  const filteredSessions = sessions.filter(s => {
    const semMatch = !selectedSemester || getSemesterKey(new Date(s.scheduled_at)) === selectedSemester
    const subjectName = enrolledClasses.find(c => c.id === s.class_id)?.subject_name ?? ''
    const mapelMatch = !selectedMapel || subjectName === selectedMapel
    return semMatch && mapelMatch
  })

  function handleRowClick(sessionId: string) {
    if (expandedId === sessionId) { setExpandedId(null); return }
    setExpandedId(sessionId)
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

  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Belum ada sesi.</p>
  }

  const selectCls = "text-sm text-gray-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedSemester}
          onChange={e => { setSelectedSemester(e.target.value); setExpandedId(null) }}
          className={selectCls}
        >
          {semesterKeys.map(key => (
            <option key={key} value={key}>{getSemesterLabel(key)}</option>
          ))}
        </select>

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
      </div>

      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="w-8 pl-3 pr-1 py-2.5 text-left">No</th>
              <th className="w-28 px-3 py-2.5 text-left">Tanggal</th>
              <th className="w-16 px-3 py-2.5 text-left">Jam</th>
              <th className="w-24 px-3 py-2.5 text-left hidden sm:table-cell">Mapel</th>
              <th className="w-24 px-3 py-2.5 text-left hidden md:table-cell">Tutor</th>
              <th className="w-24 px-3 py-2.5 text-left">Kehadiran</th>
              <th className="w-12 pr-4 pl-2 py-2.5" />
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
              const cls = enrolledClasses.find(c => c.id === s.class_id)
              const dt = new Date(s.scheduled_at)
              const attendance = attendanceMap[s.id]
              const attendanceSt = attendance
                ? (ATTENDANCE_STATUS[attendance] ?? { label: attendance, cls: 'bg-gray-100 text-gray-500' })
                : null
              const isExpanded = expandedId === s.id
              const isLoading = loadingId === s.id
              const detail = detailMap[s.id]


              return (
                <Fragment key={s.id}>
                  <tr
                    onClick={() => handleRowClick(s.id)}
                    className={`cursor-pointer transition-colors ${isExpanded ? 'font-medium bg-slate-50 [&>td]:text-gray-900 [&>td]:border-t [&>td]:border-t-slate-300 border-b border-b-slate-300 [&>td:last-child]:border-r [&>td:last-child]:border-r-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`w-8 pl-3 pr-1 py-2.5 text-gray-400 text-xs border-l-[3px] ${isExpanded ? 'border-l-blue-500' : 'border-l-transparent'}`}>{idx + 1}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">
                      {dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="w-16 px-3 py-2.5 whitespace-nowrap text-gray-500">
                      {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell truncate">{cls?.subject_name ?? '—'}</td>
                    <td
                      className="px-3 py-2.5 text-gray-500 hidden md:table-cell truncate"
                      title={cls?.tutor?.full_name ?? undefined}
                    >
                      {cls?.tutor?.full_name?.split(' ')[0] ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {attendanceSt
                        ? <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${attendanceSt.cls}`}>{attendanceSt.label}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="w-12 pr-4 pl-2 py-2.5">
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
                      <td colSpan={7} className="bg-white p-0 border-l-[3px] border-l-blue-500 border-t border-t-slate-300 border-b border-b-slate-300 border-r border-r-slate-300">
                        <div className="pl-3 pr-4 py-3">
                          {isLoading ? (
                            <p className="text-sm text-gray-400 py-1">Memuat...</p>
                          ) : detail === null ? (
                            <p className="text-sm text-gray-400 py-1">Gagal memuat detail.</p>
                          ) : (() => {
                            const items: { label: string; node: React.ReactNode }[] = []
                            if (detail.tema)
                              items.push({ label: 'Tema', node: <span className="text-sm text-gray-700">{detail.tema}</span> })
                            if (detail.topik || s.topic)
                              items.push({ label: 'Topik', node: <span className="text-sm text-gray-700">{detail.topik ?? s.topic}</span> })
                            if (detail.cp_list.length > 0)
                              items.push({
                                label: 'CP',
                                node: (
                                  <div className="space-y-1.5">
                                    {detail.cp_list.map((cp, i) => (
                                      <div key={cp.id} className="flex items-start gap-1.5">
                                        {detail.cp_list.length > 1 && (
                                          <span className="text-sm text-gray-400 shrink-0 w-4 leading-5">{i + 1}.</span>
                                        )}
                                        <span className="text-sm text-gray-700 leading-5">{cp.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                ),
                              })
                            const bankSoalCps = detail.cp_list.filter(cp => cp.bank_soal_url)
                            const soalAsesmenList = (detail.assessments ?? []).filter(a => a.link_url)
                            const chipCls = "inline-flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-white px-2 py-0.5 rounded-full hover:bg-blue-50 transition-colors"

                            if ((detail.materials?.length ?? 0) > 0)
                              items.push({
                                label: 'Materi',
                                node: (
                                  <div className="flex flex-wrap gap-1.5">
                                    {detail.materials.map(m => {
                                      const href = m.link_url ?? (m.file_path ? `/api/materials/${m.id}` : null)
                                      if (!href) return <span key={m.id} className="text-sm text-gray-700">{m.title}</span>
                                      return (
                                        <Link key={m.id} href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={chipCls}>
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                          {m.title}
                                        </Link>
                                      )
                                    })}
                                  </div>
                                ),
                              })
                            if (bankSoalCps.length > 0 || soalAsesmenList.length > 0)
                              items.push({
                                label: 'Bank Soal',
                                node: (
                                  <div className="flex flex-wrap gap-1.5">
                                    {soalAsesmenList.map((a, i) => (
                                      <Link key={a.id} href={a.link_url!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={chipCls}>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        {`Asesmen ${i + 1}`}
                                      </Link>
                                    ))}
                                    {bankSoalCps.map((cp, i) => (
                                      <Link key={cp.id} href={cp.bank_soal_url!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={chipCls}>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        {bankSoalCps.length > 1 ? `CP ${i + 1}` : 'Bank Soal'}
                                      </Link>
                                    ))}
                                  </div>
                                ),
                              })
                            if ((detail.assessments?.length ?? 0) > 0)
                              items.push({
                                label: 'Nilai',
                                node: (
                                  <div className="space-y-1.5">
                                    {detail.assessments.map((a, i) => (
                                      <div key={a.id} className="flex items-center gap-2 flex-wrap">
                                        {detail.assessments.length > 1 && (
                                          <span className="text-sm text-gray-500 font-medium">Asesmen {i + 1}:</span>
                                        )}
                                        {a.score !== null
                                          ? <span className="text-sm"><span className={`font-semibold ${a.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{a.score}</span><span className="text-gray-500">/{a.max_score}</span></span>
                                          : <span className="text-sm text-gray-400">Belum dinilai</span>}
                                        {a.level && COMPREHENSION_LEVELS[a.level] && (
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${COMPREHENSION_LEVELS[a.level].bg} ${COMPREHENSION_LEVELS[a.level].text}`}>
                                            {COMPREHENSION_LEVELS[a.level].label}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ),
                              })
                            if (detail.catatan)
                              items.push({ label: 'Catatan', node: <span className="text-sm text-gray-700 leading-relaxed">{detail.catatan}</span> })
                            const detailLink = (
                              <Link href={`/admin/sessions/${s.id}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                Lihat detail sesi
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </Link>
                            )
                            return (
                              <div>
                                {items.length === 0 ? (
                                  <div className="flex items-center justify-between py-2">
                                    <p className="text-sm text-gray-400">Belum ada catatan untuk sesi ini.</p>
                                    {detailLink}
                                  </div>
                                ) : (
                                  <>
                                    {items.map((item, i) => (
                                      <div key={i} className="flex gap-2">
                                        <div className="flex w-24 shrink-0 pb-1.5 pt-2 justify-between items-start">
                                          <span className="text-sm font-medium text-gray-500 leading-5">{item.label}</span>
                                          <span className="text-sm font-medium text-gray-500 leading-5">:</span>
                                        </div>
                                        <div className={`flex-1 pb-1.5 pt-2 flex items-start ${i > 0 ? 'border-t border-slate-200' : ''}`}>{item.node}</div>
                                      </div>
                                    ))}
                                    <div className="flex justify-end py-1.5 pt-2 border-t border-slate-200" onClick={e => e.stopPropagation()}>
                                      {detailLink}
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })()}
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
    </div>
  )
}
