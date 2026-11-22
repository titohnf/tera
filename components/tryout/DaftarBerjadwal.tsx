'use client'

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
  /** Hasil yang sudah dirender di server; hanya ada bila hasilnya sudah dibuka. */
  hasil?: React.ReactNode
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

function Kapsul({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{children}</span>
}

function IkonKalender() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="4.5" width="14" height="12" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
    </svg>
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
  const [terbuka, setTerbuka] = useState<Set<string>>(() => new Set())
  const alih = (id: string) =>
    setTerbuka((s) => {
      const n = new Set(s)
      if (!n.delete(id)) n.add(id)
      return n
    })
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

      {paket.some((p) => p.keadaan === 'belum') && <p className="text-xs text-gray-500">{petunjukMasuk}</p>}

      {isi.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          {aktif === 'hari-ini' && 'Tidak ada try out hari ini.'}
          {aktif === 'lewat' && 'Belum ada try out yang sudah lewat.'}
          {aktif === 'akan-datang' && 'Belum ada try out yang akan datang.'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {isi.map((p) => {
            const st = status(p, sekarangServer)
            const aksen = urutMapel(p.mapel) === 0 ? 'border-l-blue-600' : urutMapel(p.mapel) === 1 ? 'border-l-amber-500' : 'border-l-slate-400'
            return (
              <div key={p.id} id={`hasil-${p.id}`} className={`scroll-mt-4 rounded-xl border-l-4 bg-white px-4 py-3 shadow-sm ring-1 ring-gray-900/5 ${aksen}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[15px] font-semibold leading-snug tracking-tight text-gray-900">{p.judul}</p>
                  <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.kelas}`}>{st.teks}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Kapsul>{p.jenjang}{p.kelas ? ` · Kelas ${p.kelas}` : ''}</Kapsul>
                  <Kapsul>{p.mapel}</Kapsul>
                  {p.menit ? <Kapsul>{p.menit} menit</Kapsul> : null}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-sm text-gray-700">
                    <IkonKalender />
                    <span className="min-w-0">{tanggalPengerjaan(p)}</span>
                  </p>
                  {p.keadaan === 'belum' && (
                    <TombolMulai href={p.hrefMulai} bukaPada={p.bukaPada} tutupPada={p.tutupPada} sekarangServer={sekarangServer} lewati={lewatiJadwal} />
                  )}
                  {p.keadaan === 'selesai' && p.hasil && (
                    <button
                      type="button"
                      onClick={() => alih(p.id)}
                      aria-expanded={terbuka.has(p.id)}
                      className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {terbuka.has(p.id) ? 'Tutup hasil' : 'Lihat hasil'}
                    </button>
                  )}
                  {p.keadaan === 'menunggu' && (
                    <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-500" title="Hasil dibuka setelah semua sesi try out selesai">
                      Hasil belum dibuka
                    </span>
                  )}
                </div>
                {p.keadaan === 'selesai' && p.hasil && terbuka.has(p.id) && <div className="mt-3 border-t border-gray-100 pt-3">{p.hasil}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
