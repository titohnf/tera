'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useParamUrl } from '@/components/admin/laporan-bulanan/useParamUrl'

export type KolomLatihan = { kunci: string; label: string; lengkap?: string }

/** Warna sel; angka mentahnya tetap terbaca, warna hanya menandai. */
export type Nada = 'hijau' | 'biru' | 'kuning' | 'merah'

const GAYA_NADA: Record<Nada, string> = {
  hijau: 'bg-green-50 text-green-800',
  biru: 'bg-blue-50 text-blue-800',
  kuning: 'bg-amber-50 text-amber-800',
  merah: 'bg-red-50 text-red-800',
}

/** Berlatih dalam ≤ 7 hari dianggap aktif; > 14 hari dianggap diam. */
const HARI_AKTIF = 7
const HARI_DIAM = 14

type Aktivitas = '' | 'aktif' | 'diam' | 'belum'

function aktivitasDari(hari: number | null): Exclude<Aktivitas, ''> | null {
  if (hari === null) return 'belum'
  if (hari <= HARI_AKTIF) return 'aktif'
  if (hari > HARI_DIAM) return 'diam'
  return null
}

export type BarisLatihan = {
  id: string
  nama: string
  /** Kelas siswa di sekolah; null kalau belum diisi. */
  kelas: string | null
  /** Siswa bimbel (akun keluarga) atau pelanggan langganan (role `mandiri`). */
  jenis: 'bimbel' | 'langganan'
  /** Hari sejak sesi latihan/Misi terakhir (hari kalender WIB); null = belum pernah berlatih. */
  hari: number | null
  /** Per kolom: teks yang digambar dan angka untuk mengurutkan (null = kosong). */
  sel: Record<string, { teks: string; nilai: number | null; judul?: string; nada?: Nada }>
}

const SEL = 'border-b border-r border-slate-200 px-4 py-3 last:border-r-0'
const KOSONG = '__kosong__'

type Arah = 'asc' | 'desc'

const NAMA_JENIS = { bimbel: 'Bimbel', langganan: 'Langganan' } as const

/**
 * Tabel siswa untuk menu Latihan Mandiri dan Ketuntasan Materi: satu baris per
 * siswa, ringkasannya di kolom, dan klik baris membuka rincian siswa itu.
 *
 * Pola dan perilakunya sama dengan `TabelSiswaUrut` (Progres Kelas): kolom bisa
 * diurutkan, sel kosong selalu di bawah apa pun arahnya, ada pencarian dan
 * filter kelas. Isi sel sudah jadi teks dari server; komponen ini hanya
 * mengurutkan dan menggambar, jadi tidak ada aturan penilaian di browser.
 */
export default function TabelLatihanSiswa({
  baris,
  kolom,
  hrefDasar,
  kataKosong,
}: {
  baris: BarisLatihan[]
  kolom: KolomLatihan[]
  /** Alamat halaman ini; `?student_id=` ditambahkan untuk rincian. */
  hrefDasar: string
  kataKosong: string
}) {
  const router = useRouter()
  // Semua keadaan tabel ikut tertulis di alamat halaman, supaya tombol kembali
  // dari halaman rincian mengembalikan urutan dan saringan yang sama.
  const [kunci, setKunci] = useParamUrl<string>('urut', 'nama')
  const [arah, setArah] = useParamUrl<Arah>('arah', 'asc')
  const [cari, setCari] = useParamUrl<string>('cari', '')
  const [kelasDipilih, setKelasDipilih] = useParamUrl<string>('kelas', '')
  // '' = semua jenis.
  const [jenisDipilih, setJenisDipilih] = useParamUrl<'' | 'bimbel' | 'langganan'>('jenis', '')
  const [aktivitas, setAktivitas] = useParamUrl<Aktivitas>('aktivitas', '')

  const { opsiKelas, adaTanpaKelas } = useMemo(() => {
    const unik = [...new Set(baris.map(b => b.kelas).filter((k): k is string => k !== null))]
    unik.sort((a, b) => {
      const x = Number(a)
      const y = Number(b)
      return Number.isNaN(x) || Number.isNaN(y) ? a.localeCompare(b, 'id') : x - y
    })
    return { opsiKelas: unik, adaTanpaKelas: baris.some(b => b.kelas === null) }
  }, [baris])

  function urutkan(k: string) {
    if (k === kunci) setArah(a => (a === 'asc' ? 'desc' : 'asc'))
    else {
      setKunci(k)
      setArah('asc')
    }
  }

  const terurut = useMemo(() => {
    const nilaiDari = (b: BarisLatihan): string | number | null => {
      if (kunci === 'nama') return b.nama
      if (kunci === 'jenis') return NAMA_JENIS[b.jenis]
      if (kunci === 'kelas') {
        const n = Number(b.kelas)
        return b.kelas === null ? null : Number.isNaN(n) ? b.kelas : n
      }
      return b.sel[kunci]?.nilai ?? null
    }
    const tanda = arah === 'asc' ? 1 : -1
    const kata = cari.trim().toLowerCase()
    const tersaringTanpaAktivitas = baris.filter(
      b =>
        (!kata || b.nama.toLowerCase().includes(kata)) &&
        (jenisDipilih === '' || b.jenis === jenisDipilih) &&
        (kelasDipilih === '' ||
          (kelasDipilih === KOSONG ? b.kelas === null : b.kelas === kelasDipilih)),
    )
    const tersaring = tersaringTanpaAktivitas.filter(
      b => aktivitas === '' || aktivitasDari(b.hari) === aktivitas,
    )
    const urut = [...tersaring].sort((a, b) => {
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
    // Hitungan ringkasan memakai saringan LAIN (nama, jenis, kelas) tapi tidak
    // saringan aktivitas sendiri: yang ditanyakan "dari yang tampil, berapa yang
    // diam", dan itu tidak boleh berubah sesudah ringkasannya diklik.
    const hitung = { aktif: 0, diam: 0, belum: 0 }
    for (const b of tersaringTanpaAktivitas) {
      const a = aktivitasDari(b.hari)
      if (a) hitung[a] += 1
    }
    return { urut, hitung, jumlahTanpaAktivitas: tersaringTanpaAktivitas.length }
  }, [baris, kunci, arah, cari, kelasDipilih, jenisDipilih, aktivitas])

  function judul(k: string, label: string, lengkap?: string) {
    const aktif = k === kunci
    return (
      <th
        key={k}
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

  const { urut: terurutBaris, hitung } = terurut

  if (baris.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500">Belum ada siswa aktif.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Ringkasan aktivitas, SEKALIGUS saringannya: mengklik sebuah angka
          menyaring tabel ke siswa itu, mengklik lagi melepasnya. */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { kunci: 'aktif', label: `Berlatih ≤ ${HARI_AKTIF} hari`, nada: 'hijau' },
            { kunci: 'diam', label: `Tidak berlatih > ${HARI_DIAM} hari`, nada: 'kuning' },
            { kunci: 'belum', label: 'Belum pernah berlatih', nada: 'merah' },
          ] as const
        ).map(c => {
          const dipilih = aktivitas === c.kunci
          return (
            <button
              key={c.kunci}
              type="button"
              aria-pressed={dipilih}
              onClick={() => setAktivitas(dipilih ? '' : c.kunci)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                dipilih
                  ? `${GAYA_NADA[c.nada]} border-current font-semibold`
                  : 'border-slate-200 bg-white text-gray-600 hover:bg-slate-50'
              }`}
            >
              {c.label}
              <span className="font-semibold tabular-nums">{hitung[c.kunci]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter jenis siswa"
          value={jenisDipilih}
          onChange={e => setJenisDipilih(e.target.value as '' | 'bimbel' | 'langganan')}
          className="rounded-lg border bg-white py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua siswa</option>
          <option value="bimbel">Siswa bimbel</option>
          <option value="langganan">Siswa langganan</option>
        </select>
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
        <div className="ml-auto flex items-center gap-3">
          <p className="shrink-0 text-xs text-gray-400">
            {terurutBaris.length === baris.length
              ? `${baris.length} siswa`
              : `${terurutBaris.length} dari ${baris.length} siswa`}
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

      <div className="max-h-[calc(100dvh-16rem)] min-h-[20rem] overflow-auto rounded-xl bg-white shadow ring-1 ring-gray-900/5">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left">
              <th className="sticky left-0 top-0 z-30 w-12 min-w-[3rem] border-b border-r border-slate-300 bg-slate-100 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-900">
                No
              </th>
              {judul('nama', 'Siswa')}
              {judul('kelas', 'KLS', 'Kelas')}
              {judul('jenis', 'Jenis', 'Siswa bimbel atau siswa langganan')}
              {kolom.map(k => judul(k.kunci, k.label, k.lengkap))}
            </tr>
          </thead>
          <tbody>
            {terurutBaris.length === 0 && (
              <tr>
                <td colSpan={4 + kolom.length} className="px-4 py-10 text-center text-sm text-gray-400">
                  Tidak ada siswa yang cocok dengan saringan ini.
                </td>
              </tr>
            )}
            {terurutBaris.map((b, i) => {
              const zebra = i % 2 === 1 ? 'bg-slate-50' : 'bg-white'
              const href = `${hrefDasar}?student_id=${b.id}`
              return (
                <tr
                  key={b.id}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('a,button')) return
                    router.push(href)
                  }}
                  className={`group cursor-pointer ${zebra} hover:bg-blue-50`}
                >
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
                  <td className={`${SEL} whitespace-nowrap`}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.jenis === 'langganan'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {NAMA_JENIS[b.jenis]}
                    </span>
                  </td>
                  {kolom.map(k => {
                    const s = b.sel[k.kunci]
                    return (
                      <td key={k.kunci} className={`${SEL} tabular-nums`}>
                        {s && s.teks !== '' ? (
                          <span
                            title={s.judul}
                            className={
                              s.nada
                                ? `whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${GAYA_NADA[s.nada]}`
                                : 'whitespace-nowrap font-medium text-gray-900'
                            }
                          >
                            {s.teks}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-xs text-gray-400">{kataKosong}</p>
    </div>
  )
}
