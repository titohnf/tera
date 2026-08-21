'use client'

import { useState, useTransition } from 'react'
import { KEHADIRAN, sorotBaris } from '@/lib/kehadiran'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import { getJadwalSessionDetail, type JadwalSessionDetail } from '@/lib/actions/jadwal'
import RincianSesi from '@/components/siswa/RincianSesi'

/**
 * Daftar sesi versi ponsel untuk portal keluarga — satu sesi satu kartu.
 *
 * `JadwalTable` tetap dipakai di layar lebar, dan tetap satu-satunya bentuk di
 * halaman admin. Di ponsel tabel itu meluber sekitar 89px dari lebar 375px
 * meski Mapel dan Tutor sudah disembunyikan, sehingga harus digeser mendatar —
 * gerakan yang jarang ditemukan sendiri, dan orang tua akan mengira kolomnya
 * memang hanya segitu.
 *
 * Penyaring bulan/mapel/status milik `JadwalTable` sengaja tidak dibawa ke
 * sini. Orang tua membuka daftar ini untuk satu-dua pertanyaan — "kapan les
 * berikutnya" dan "kemarin anak saya hadir tidak" — bukan untuk memeriksa
 * silang seperti admin. Yang ada cukup pemisah bulan dan tombol "lihat semua".
 *
 * Kosakata kehadirannya tetap dari `lib/kehadiran`, jadi label dan warnanya
 * sama persis dengan yang dibaca admin.
 *
 * Kartunya bisa dibuka, dan isinya `RincianSesi` — komponen yang sama dengan
 * yang dipakai baris `JadwalTable` di layar lebar. Sebelum ada ini, tema,
 * daftar CP, tautan materi, latihan soal, nilai asesmen, dan catatan tutor
 * sama sekali tidak terjangkau dari ponsel: satu-satunya jalan ke sana adalah
 * membuka baris tabel yang justru `hidden lg:block`.
 */

type Sesi = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
  cancellation_reason?: string | null
}

/** Sesi yang ditampilkan lebih dulu sebelum "Lihat semua" ditekan. */
const AWAL = 8

function namaBulan(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

function kunciBulan(iso: string): string {
  // Geseran +7 jam yang sama dengan `bulanWib` di JadwalTable: sesi pagi
  // (00:00–06:59 WIB) jatuh di tanggal UTC sebelumnya, dan kalau itu tanggal 1
  // ia masuk ke bulan yang salah.
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

export default function SesiKartuList({
  sessions,
  subjectNameMap,
  attendanceMap,
  sessionTutorMap,
  namaKelas,
  studentId,
}: {
  sessions: Sesi[]
  subjectNameMap: Record<string, string>
  attendanceMap: Record<string, string>
  sessionTutorMap: Record<string, string>
  namaKelas: Record<string, string | null>
  studentId: string
}) {
  const [semua, setSemua] = useState(false)
  const [dibuka, setDibuka] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, JadwalSessionDetail | null>>({})
  const [memuat, startMemuat] = useTransition()

  function bukaTutup(id: string) {
    if (dibuka === id) {
      setDibuka(null)
      return
    }
    setDibuka(id)
    // Sekali ambil per sesi; hasilnya disimpan supaya membuka ulang tidak
    // memanggil server lagi.
    if (detail[id] !== undefined) return
    startMemuat(async () => {
      const hasil = await getJadwalSessionDetail(id, studentId)
      setDetail((d) => ({ ...d, [id]: hasil }))
    })
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Belum ada sesi.</p>
  }

  const urut = [...sessions].sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
  const tampil = semua ? urut : urut.slice(0, AWAL)

  // Penanda "ini awal bulan baru" dihitung DI SINI, bukan dengan variabel yang
  // diperbarui di dalam map: mengubah nilai saat render melanggar aturan
  // `react-hooks/immutability`, dan hasilnya ikut bergantung pada urutan render
  // yang tidak dijamin.
  const bulanBaruDi = new Set<string>()
  let bulanSebelumnya = ''
  for (const s of tampil) {
    const b = kunciBulan(s.scheduled_at)
    if (b !== bulanSebelumnya) bulanBaruDi.add(s.id)
    bulanSebelumnya = b
  }

  return (
    <div className="space-y-2.5">
      {tampil.map(s => {
        const dt = new Date(s.scheduled_at)
        const kehadiran = attendanceMap[s.id]
        const st = kehadiran
          ? (KEHADIRAN[kehadiran] ?? { label: kehadiran, cls: 'bg-gray-100 text-gray-500' })
          : null
        const sorot = sorotBaris(s.status, kehadiran)
        const mapel = s.subject_id ? subjectNameMap[s.subject_id] : null
        const tutor = sessionTutorMap[s.id]
        const kelas = namaKelas[s.class_id]

        const bulanBaru = bulanBaruDi.has(s.id)
        const terbuka = dibuka === s.id

        return (
          <div key={s.id}>
            {bulanBaru && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-3 pb-1.5">
                {namaBulan(s.scheduled_at)}
              </p>
            )}
            <div className={`rounded-xl border border-slate-200 border-l-[3px] ${sorot.garis} overflow-hidden`}>
              <button
                type="button"
                onClick={() => bukaTutup(s.id)}
                aria-expanded={terbuka}
                className="w-full text-left p-4 active:bg-slate-50 transition-colors"
              >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${s.status === 'cancelled' ? 'text-red-500' : 'text-gray-900'}`}>
                    {dt.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {mapel && <> · {mapel}</>}
                  </p>
                </div>
                {s.status === 'cancelled' ? (
                  <span className="inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                    Dibatalkan
                  </span>
                ) : st ? (
                  <span className={`inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                    {st.label}
                  </span>
                ) : (
                  <span className="inline-flex whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    Terjadwal
                  </span>
                )}
              </div>

              {(s.topic || tutor || kelas) && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                  {s.topic && <p className="text-sm text-gray-700">{s.topic}</p>}
                  <p className="text-xs text-gray-400">
                    {kelas && stripClassUniqueTag(kelas)}
                    {kelas && tutor && ' · '}
                    {tutor}
                  </p>
                </div>
              )}

              {s.status === 'cancelled' && s.cancellation_reason && (
                <p className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-red-500">
                  {s.cancellation_reason}
                </p>
              )}

              <span className="flex items-center justify-center gap-1 mt-2.5 pt-2.5 border-t border-slate-100 text-xs font-medium text-blue-600">
                {terbuka ? 'Tutup rincian' : 'Lihat rincian'}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${terbuka ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              </button>

              {terbuka && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  <RincianSesi
                    detail={memuat && detail[s.id] === undefined ? undefined : detail[s.id]}
                    sessionId={s.id}
                    topikSesi={s.topic}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {!semua && urut.length > AWAL && (
        <button
          type="button"
          onClick={() => setSemua(true)}
          className="w-full min-h-11 text-sm font-medium text-blue-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Lihat semua {urut.length} sesi
        </button>
      )}
    </div>
  )
}
