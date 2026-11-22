'use client'

import Link from 'next/link'
import { useState } from 'react'
import TombolMulai from '@/components/tryout/TombolMulai'
import { hariWib, jamWib, tanggalWib, urutJenjang, urutMapel } from '@/lib/tryout/paket'

export interface ItemBerjadwal {
  id: string
  judul: string
  jenjang: string
  kelas: string | null
  mapel: string
  menit: number | null
  bukaPada: string | null
  tutupPada: string | null
  /** 'belum' = belum dikerjakan; 'menunggu' = sudah dikirim, hasil belum dibuka; 'selesai' = hasil dibuka. */
  keadaan: 'belum' | 'menunggu' | 'selesai'
  hrefMulai: string
  hrefHasil: string
}

type Saring = 'hari-ini' | 'lewat' | 'akan-datang'

const TAB: { kunci: Saring; label: string }[] = [
  { kunci: 'hari-ini', label: 'Hari ini' },
  { kunci: 'lewat', label: 'Sudah lewat' },
  { kunci: 'akan-datang', label: 'Yang akan datang' },
]

/**
 * Kelompok sebuah try out menurut jadwalnya.
 * Tanpa jadwal sama sekali, try out dianggap tersedia sekarang ("Hari ini"), supaya daftar tidak
 * kosong selama jadwal belum diisi admin.
 */
function kelompok(p: ItemBerjadwal, sekarang: number): Saring {
  const buka = p.bukaPada ? new Date(p.bukaPada).getTime() : null
  const tutup = p.tutupPada ? new Date(p.tutupPada).getTime() : null
  if (tutup !== null && sekarang >= tutup) return 'lewat'
  if (buka !== null && sekarang < buka) return tanggalWib(buka) === tanggalWib(sekarang) ? 'hari-ini' : 'akan-datang'
  if (buka !== null && tutup === null && tanggalWib(buka) < tanggalWib(sekarang) && p.keadaan !== 'belum') return 'lewat'
  return 'hari-ini'
}

function tanggalPengerjaan(p: ItemBerjadwal): string {
  const { bukaPada: b, tutupPada: t } = p
  if (!b) return 'Jadwal belum ditetapkan'
  if (!t) return `${hariWib(b)} · mulai ${jamWib(b)} WIB`
  if (tanggalWib(b) === tanggalWib(t)) return `${hariWib(b)} · ${jamWib(b)}–${jamWib(t)} WIB`
  return `${hariWib(b)} ${jamWib(b)} – ${hariWib(t)} ${jamWib(t)} WIB`
}

function status(p: ItemBerjadwal, sekarang: number): { teks: string; kelas: string } {
  if (p.keadaan === 'selesai') return { teks: 'Sudah dikerjakan · hasil dibuka', kelas: 'bg-green-100 text-green-800' }
  if (p.keadaan === 'menunggu') return { teks: 'Sudah dikerjakan · hasil belum dibuka', kelas: 'bg-green-100 text-green-800' }
  const buka = p.bukaPada ? new Date(p.bukaPada).getTime() : null
  const tutup = p.tutupPada ? new Date(p.tutupPada).getTime() : null
  if (tutup !== null && sekarang >= tutup) return { teks: 'Tidak dikerjakan', kelas: 'bg-slate-200 text-slate-600' }
  if (buka !== null && sekarang < buka) return { teks: 'Akan dibuka', kelas: 'bg-amber-100 text-amber-800' }
  return { teks: buka !== null ? 'Sedang dibuka' : 'Belum dikerjakan', kelas: 'bg-blue-100 text-blue-800' }
}

function Baris({ label, isi }: { label: string; isi: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <dt className="w-32 shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-gray-900">{isi}</dd>
    </div>
  )
}

export default function DaftarBerjadwal({
  paket,
  petunjukMasuk,
  sekarangServer,
  lewatiJadwal = false,
}: {
  paket: ItemBerjadwal[]
  petunjukMasuk: string
  sekarangServer: number
  lewatiJadwal?: boolean
}) {
  const bagi: Record<Saring, ItemBerjadwal[]> = { 'hari-ini': [], lewat: [], 'akan-datang': [] }
  for (const p of paket) bagi[kelompok(p, sekarangServer)].push(p)

  const waktu = (p: ItemBerjadwal) => (p.bukaPada ? new Date(p.bukaPada).getTime() : Number.POSITIVE_INFINITY)
  const lainnya = (a: ItemBerjadwal, b: ItemBerjadwal) =>
    urutJenjang(a.jenjang) - urutJenjang(b.jenjang) || urutMapel(a.mapel) - urutMapel(b.mapel) || a.mapel.localeCompare(b.mapel, 'id')
  bagi['hari-ini'].sort((a, b) => waktu(a) - waktu(b) || lainnya(a, b))
  bagi['akan-datang'].sort((a, b) => waktu(a) - waktu(b) || lainnya(a, b))
  bagi.lewat.sort((a, b) => waktu(b) - waktu(a) || lainnya(a, b))

  // Tab awal: yang pertama berisi, supaya orang tidak mendarat di daftar kosong.
  const awal = TAB.find((t) => bagi[t.kunci].length > 0)?.kunci ?? 'hari-ini'
  const [aktif, setAktif] = useState<Saring>(awal)
  const isi = bagi[aktif]

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Saring try out menurut jadwal" className="flex flex-wrap gap-2">
        {TAB.map((t) => (
          <button
            key={t.kunci}
            type="button"
            role="tab"
            aria-selected={aktif === t.kunci}
            onClick={() => setAktif(t.kunci)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${aktif === t.kunci ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs ${aktif === t.kunci ? 'text-blue-100' : 'text-gray-400'}`}>{bagi[t.kunci].length}</span>
          </button>
        ))}
      </div>

      {isi.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          {aktif === 'hari-ini' && 'Tidak ada try out hari ini.'}
          {aktif === 'lewat' && 'Belum ada try out yang sudah lewat.'}
          {aktif === 'akan-datang' && 'Belum ada try out yang akan datang.'}
        </p>
      ) : (
        <div className="space-y-3">
          {isi.map((p) => {
            const st = status(p, sekarangServer)
            return (
              <div key={p.id} className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-base font-semibold tracking-tight text-gray-900">{p.judul}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.kelas}`}>{st.teks}</span>
                </div>
                <dl className="mt-3 space-y-1.5">
                  <Baris label="Target siswa" isi={`${p.jenjang}${p.kelas ? ` · Kelas ${p.kelas}` : ''}`} />
                  <Baris label="Mata pelajaran" isi={p.mapel} />
                  <Baris label="Tanggal pengerjaan" isi={tanggalPengerjaan(p)} />
                  {p.menit ? <Baris label="Durasi" isi={`${p.menit} menit`} /> : null}
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">{p.keadaan === 'belum' ? petunjukMasuk : 'Kamu sudah mengerjakan try out ini'}</p>
                  {p.keadaan === 'belum' && (
                    <TombolMulai href={p.hrefMulai} bukaPada={p.bukaPada} tutupPada={p.tutupPada} sekarangServer={sekarangServer} lewati={lewatiJadwal} />
                  )}
                  {p.keadaan === 'selesai' && (
                    <Link href={p.hrefHasil} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      Lihat hasil
                    </Link>
                  )}
                  {p.keadaan === 'menunggu' && (
                    <span className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-500" title="Hasil dibuka setelah semua sesi try out selesai">
                      Hasil belum dibuka
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
