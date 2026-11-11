'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useParamUrl } from '@/components/admin/laporan-bulanan/useParamUrl'

export type BarisSiswa = {
  id: string
  nama: string
  /** Kelas siswa di sekolah (mis. "9"), bukan nama kelas bimbel; null kalau belum diisi. */
  kelas: string | null
  /** Persen kehadiran bulan itu; null kalau tidak ada sesi. */
  pct: number | null
  hadir: number
  sesi: number
  /** Rata-rata nilai asesmen per mapel, persen. Mapel tanpa nilai tidak ada. */
  nilai: Record<string, number>
  /** Bulan (YYYY-MM) yang dibuka saat barisnya diklik. */
  bulanDetail: string
}

/**
 * Singkatan judul kolom mapel. Nama lengkapnya tetap terbaca lewat tooltip, dan
 * mapel yang tidak ada di sini ditulis apa adanya.
 */
const SINGKATAN: Record<string, string> = {
  'Bahasa Indonesia': 'BI',
  'Bahasa Inggris': 'Eng',
  Biologi: 'Bio',
  Ekonomi: 'Eko',
  Fisika: 'Fis',
  Kimia: 'Kim',
  Matematika: 'MTK',
}

/** Kelas bersama sel isi: garis tegak dan mendatar, jarak isi. */
const SEL = 'border-b border-r border-slate-200 px-4 py-3 last:border-r-0'

/** Nilai pilihan filter kelas untuk siswa yang kelasnya belum diisi. */
const KOSONG = '__kosong__'

type Kunci = 'nama' | 'kelas' | 'pct' | `mapel:${string}`
type Arah = 'asc' | 'desc'

/**
 * Tabel Progres Kelas semua siswa, tiap kolomnya bisa diurutkan.
 *
 * Klik judul kolom mengurutkan naik (A–Z, kecil ke besar); klik lagi membaliknya.
 * Sel kosong (tidak ada sesi, tidak ada nilai) SELALU di bawah, apa pun arahnya:
 * kosong bukan nilai terkecil maupun terbesar, dan kalau ikut terbalik ia akan
 * menumpuk di puncak tepat saat orang mencari yang tertinggi.
 *
 * Bawaannya kehadiran terendah di atas, supaya yang perlu ditengok terbaca
 * lebih dulu.
 */
export default function TabelSiswaUrut({
  baris,
  mapel,
  pemilihPeriode,
}: {
  baris: BarisSiswa[]
  mapel: string[]
  /** Pemilih periode dari halaman; ditaruh sebaris dengan pencarian. */
  pemilihPeriode: React.ReactNode
}) {
  const router = useRouter()
  const [kunci, setKunci] = useParamUrl<Kunci>('urut', 'pct')
  const [arah, setArah] = useParamUrl<Arah>('arah', 'asc')
  const [cari, setCari] = useParamUrl<string>('cari', '')
  // '' = semua kelas; KOSONG = siswa yang kelasnya belum diisi.
  const [kelasDipilih, setKelasDipilih] = useParamUrl<string>('kelas', '')

  // Hanya kelas yang memang dimiliki siswa di tabel ini, urut numerik.
  const { opsiKelas, adaTanpaKelas } = useMemo(() => {
    const unik = [...new Set(baris.map(b => b.kelas).filter((k): k is string => k !== null))]
    unik.sort((a, b) => {
      const x = Number(a)
      const y = Number(b)
      return Number.isNaN(x) || Number.isNaN(y) ? a.localeCompare(b, 'id') : x - y
    })
    return { opsiKelas: unik, adaTanpaKelas: baris.some(b => b.kelas === null) }
  }, [baris])

  function urutkan(k: Kunci) {
    if (k === kunci) setArah(a => (a === 'asc' ? 'desc' : 'asc'))
    else {
      setKunci(k)
      setArah('asc')
    }
  }

  const terurut = useMemo(() => {
    const nilaiDari = (b: BarisSiswa): string | number | null => {
      if (kunci === 'nama') return b.nama
      if (kunci === 'kelas') {
        // Angka kalau bisa, supaya 9 jatuh sebelum 10, bukan sesudahnya.
        const n = Number(b.kelas)
        return b.kelas === null ? null : Number.isNaN(n) ? b.kelas : n
      }
      if (kunci === 'pct') return b.pct
      return b.nilai[kunci.slice('mapel:'.length)] ?? null
    }
    const tanda = arah === 'asc' ? 1 : -1
    const kata = cari.trim().toLowerCase()
    const tersaring = baris.filter(
      b =>
        (!kata || b.nama.toLowerCase().includes(kata)) &&
        (kelasDipilih === '' ||
          (kelasDipilih === KOSONG ? b.kelas === null : b.kelas === kelasDipilih)),
    )
    return [...tersaring].sort((a, b) => {
      const x = nilaiDari(a)
      const y = nilaiDari(b)
      if (x === null && y === null) return a.nama.localeCompare(b.nama, 'id')
      if (x === null) return 1
      if (y === null) return -1
      const banding =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), 'id')
      return banding * tanda || a.nama.localeCompare(b.nama, 'id')
    })
  }, [baris, kunci, arah, cari, kelasDipilih])

  // Fungsi biasa, bukan komponen: komponen yang dibuat di dalam render lahir
  // ulang tiap render dan membuang statusnya.
  function judul(k: Kunci, label: string, lengkap?: string) {
    const aktif = k === kunci
    return (
      <th
        key={k}
        // Sticky ke atas (judul tetap terlihat saat baris digulir) dan, untuk
        // kolom nama, ke kiri juga. `border-separate` dan bukan `collapse`:
        // pada tabel yang runtuh, garis sel sticky ikut hilang saat digulir.
        className={`sticky top-0 border-b border-r border-slate-300 bg-slate-100 px-4 py-3 last:border-r-0 ${
          k === 'nama' ? 'left-12 z-30' : 'z-20'
        } ${k === 'kelas' ? 'text-center' : ''}`}
        aria-sort={aktif ? (arah === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          title={lengkap}
          onClick={() => urutkan(k)}
          className="inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-900 hover:text-blue-700"
        >
          {label}
          <span aria-hidden className={aktif ? 'text-blue-600' : 'text-slate-400'}>
            {aktif ? (arah === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mencari = menyaring baris tabel ini. Membuka laporan seorang siswa
          hanya lewat klik barisnya. */}
      <div className="flex flex-wrap items-center gap-3">
        {pemilihPeriode}
        <select
          aria-label="Filter kelas"
          value={kelasDipilih}
          onChange={e => setKelasDipilih(e.target.value)}
          className="rounded-lg border bg-white py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua kelas</option>
          {opsiKelas.map(k => (
            <option key={k} value={k}>
              Kelas {k}
            </option>
          ))}
          {adaTanpaKelas && <option value={KOSONG}>Kelas belum diisi</option>}
        </select>
        {/* Jumlah dan pencarian di ujung kanan. */}
        <div className="ml-auto flex items-center gap-3">
          <p className="shrink-0 text-xs text-gray-400">
            {terurut.length === baris.length
              ? `${baris.length} siswa`
              : `${terurut.length} dari ${baris.length} siswa`}
          </p>
          <input
            type="search"
            aria-label="Cari siswa di tabel"
            placeholder="Cari siswa…"
            value={cari}
            onChange={e => setCari(e.target.value)}
            className="w-64 max-w-full rounded-lg border bg-white py-2 pl-3 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Pembungkus ini yang menggulir ke dua arah, dengan tinggi dibatasi: sticky
          selalu menempel ke pembungkus penggulir terdekat, dan kalau yang
          menggulir halamannya, judul kolom tidak akan menempel.
          16rem = ruang di atas dan di bawah tabel (header 3,5 + padding 4 +
          judul dan deskripsi 4,75 + baris pencarian 3,2, dibulatkan ke atas):
          tabel memenuhi sisa layar tanpa membuat halamannya ikut menggulir. */}
      <div className="max-h-[calc(100dvh-16rem)] min-h-[20rem] overflow-auto rounded-xl bg-white shadow ring-1 ring-gray-900/5">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left">
              <th
                className="sticky left-0 top-0 z-30 w-12 min-w-[3rem] border-b border-r border-slate-300 bg-slate-100 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-900"
              >
                No
              </th>
              {judul('nama', 'Siswa')}
              {judul('kelas', 'KLS', 'Kelas')}
              {judul('pct', 'Kehadiran')}
              {mapel.map(m => judul(`mapel:${m}`, SINGKATAN[m] ?? m, SINGKATAN[m] ? m : undefined))}
            </tr>
          </thead>
          <tbody>
            {terurut.length === 0 && (
              <tr>
                <td colSpan={4 + mapel.length} className="px-4 py-10 text-center text-sm text-gray-400">
                  Tidak ada siswa yang cocok dengan saringan ini.
                </td>
              </tr>
            )}
            {terurut.map((b, i) => {
              // Zebra. Sel sticky butuh latar tegasnya sendiri (kalau tembus
              // pandang, isi yang digeser tampak di bawahnya), jadi warna
              // selang-selingnya dipasang di baris DAN di sel sticky.
              const zebra = i % 2 === 1 ? 'bg-slate-50' : 'bg-white'
              const href = `/admin/laporan-bulanan?student_id=${b.id}&month=${b.bulanDetail}`
              return (
                <tr
                  key={b.id}
                  // Seluruh baris menaut. Tautan di nama tetap ada untuk papan
                  // ketik dan pembaca layar; klik pada tautan dibiarkan bekerja
                  // sendiri supaya tidak terjadi dua kali navigasi.
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('a,button')) return
                    router.push(href)
                  }}
                  className={`group cursor-pointer ${zebra} hover:bg-blue-50`}
                >
                  {/* Nomor urut di tampilan ini, dihitung ulang tiap pengurutan. */}
                  <td className={`sticky left-0 z-10 w-12 min-w-[3rem] border-b border-r border-slate-200 px-2 py-3 text-center tabular-nums text-gray-400 ${zebra} group-hover:bg-blue-50`}>
                    {i + 1}
                  </td>
                  <td className={`${SEL} sticky left-12 z-10 whitespace-nowrap font-medium text-gray-900 ${zebra} group-hover:bg-blue-50`}>
                    <Link href={href} className="hover:text-blue-600 hover:underline">
                      {b.nama}
                    </Link>
                  </td>
                  <td className={`${SEL} text-center text-gray-600`}>
                    {b.kelas ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className={`${SEL} tabular-nums`}>
                    {b.pct === null ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className="whitespace-nowrap">
                        <span className="font-medium text-gray-900">{b.pct}%</span>
                        <span className="ml-1 text-xs text-gray-400">
                          ({b.hadir}/{b.sesi})
                        </span>
                      </span>
                    )}
                  </td>
                  {mapel.map(m => (
                    <td key={m} className={`${SEL} tabular-nums`}>
                      {b.nilai[m] === undefined ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="font-medium text-gray-900">{b.nilai[m]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
