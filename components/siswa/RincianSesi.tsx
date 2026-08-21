'use client'

import Link from 'next/link'
import type { JadwalSessionDetail } from '@/lib/actions/jadwal'

/**
 * Isi satu sesi yang dibuka — tema, topik, CP, materi, latihan soal, nilai, dan
 * catatan tutor.
 *
 * Diangkat dari badan `JadwalTable` supaya daftar kartu di ponsel
 * (`components/keluarga/SesiKartuList`) bisa menampilkan isi yang sama. Sebelum
 * ini panelnya hidup sebagai IIFE 124 baris di dalam sel tabel, dan karena
 * tabel itu `hidden lg:block` di portal keluarga, seluruh isinya —- termasuk
 * tautan materi dan nilai asesmen —- sama sekali tidak terjangkau dari ponsel.
 *
 * Datanya tetap datang dari server action yang sama, `getJadwalSessionDetail`,
 * yang sudah dijaga `bolehBacaMurid`.
 */

const COMPREHENSION_LEVELS: Record<string, { label: string; bg: string; text: string }> = {
  L0: { label: 'L0: Tidak Paham Sama Sekali',     bg: 'bg-red-200',    text: 'text-red-900' },
  L1: { label: 'L1: Paham Permukaan/Hafalan',      bg: 'bg-orange-200', text: 'text-orange-900' },
  L2: { label: 'L2: Paham Konsep Dasar',           bg: 'bg-yellow-200', text: 'text-yellow-900' },
  L3: { label: 'L3: Paham Pengaplikasian Konsep',  bg: 'bg-green-200',  text: 'text-green-900' },
  L4: { label: 'L4: Sangat Paham',                 bg: 'bg-blue-200',   text: 'text-blue-900' },
  L5: { label: 'L5: Mahir',                        bg: 'bg-purple-200', text: 'text-purple-900' },
}

export default function RincianSesi({
  detail,
  sessionId,
  topikSesi,
  showAdminLinks = false,
}: {
  /** `undefined` = belum diambil, `null` = gagal. */
  detail: JadwalSessionDetail | null | undefined
  sessionId: string
  topikSesi: string | null
  showAdminLinks?: boolean
}) {
  if (detail === undefined) return <p className="text-sm text-gray-400 py-1">Memuat...</p>
  if (detail === null) return <p className="text-sm text-gray-400 py-1">Gagal memuat detail.</p>


  const items: { label: string; node: React.ReactNode }[] = []
  if (detail.tema)
    items.push({ label: 'Tema', node: <span className="text-sm text-gray-700">{detail.tema}</span> })
  if (detail.topik || topikSesi)
    items.push({ label: 'Topik', node: <span className="text-sm text-gray-700">{detail.topik ?? topikSesi}</span> })
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
  const latihanSoalTopics = detail.latihan_soal_list ?? []
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
  if (latihanSoalTopics.length > 0 || soalAsesmenList.length > 0)
    items.push({
      label: 'Latihan Soal',
      node: (
        <div className="flex flex-wrap gap-1.5">
          {soalAsesmenList.map((a, i) => (
            <Link key={a.id} href={a.link_url!} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={chipCls}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {`Asesmen ${i + 1}`}
            </Link>
          ))}
          {/* Satu chip per topik, dilabeli nama topiknya — dulu
              per CP dan dilabeli "CP 1", "CP 2", yang tidak
              memberi tahu apa pun tentang isinya. */}
          {latihanSoalTopics.map(topic => (
            <Link key={topic.key} href={topic.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className={chipCls}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              {latihanSoalTopics.length > 1 ? topic.label : 'Latihan Soal'}
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
  const detailLink = showAdminLinks ? (
    <Link href={`/admin/sessions/${sessionId}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline">
      Lihat detail sesi
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </Link>
  ) : null
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
}
