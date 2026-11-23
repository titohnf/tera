'use client'

import Link from 'next/link'
import { useState } from 'react'
import TombolMulai from '@/components/tryout/TombolMulai'
import { IKON, WARNA } from '@/components/belajar/IkonMapel'
import { tahunAjaran } from '@/lib/tryout/judul'
import { golonganMapel } from '@/lib/belajar/ikon-mapel'
import { hariWib, jamWib, tanggalWib, urutJenjang, urutMapel } from '@/lib/tryout/paket'

export interface ItemBerjadwal {
  id: string
  judul: string
  jenjang: string
  kelas: string | null
  mapel: string
  menit: number | null
  jumlahSoal: number | null
  bukaPada: string | null
  tutupPada: string | null
  /** 'belum' = belum dikerjakan; 'menunggu' = sudah dikirim, hasil belum dibuka; 'selesai' = hasil dibuka. */
  keadaan: 'belum' | 'menunggu' | 'selesai'
  hrefMulai: string
  hrefHasil: string
  /** Skor akhir (0–100), bila hasilnya sudah dibuka. */
  nilai?: number | null
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

/** Tiga keadaan: belum dikerjakan, menunggu hasil (sudah dikirim, hasil belum dibuka), sudah dikerjakan. */
function status(p: ItemBerjadwal): { teks: string; kelas: string } {
  if (p.keadaan === 'belum') return { teks: 'Belum dikerjakan', kelas: 'bg-amber-100 text-amber-800' }
  if (p.keadaan === 'menunggu') return { teks: 'Menunggu hasil', kelas: 'bg-slate-200 text-slate-700' }
  return { teks: 'Sudah dikerjakan', kelas: 'bg-green-100 text-green-800' }
}

const fmtNilai = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

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

      {lewatiJadwal && (
        <div role="note" className="flex gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span aria-hidden className="mt-0.5">🧪</span>
          <p>
            <strong className="font-semibold">Ini akun penguji.</strong> Tombol Kerjakan Sekarang selalu aktif, tanpa menunggu jam buka atau jam tutup, supaya kamu bisa melihat soal dan menguji
            kunci jawaban. Kartu tetap dikelompokkan menurut jadwal seperti yang dilihat siswa. Jawaban akun penguji hanya untuk menguji dan tidak perlu disimpan:
            jangan dihitung sebagai nilai atau pengerjaan siswa.
          </p>
        </div>
      )}

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
            const st = status(p)
            const Ikon = IKON[golonganMapel(p.mapel)]
            return (
              <div key={p.id} id={`hasil-${p.id}`} className="scroll-mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                <div className="flex flex-wrap items-stretch">
                  <div className={`flex w-28 shrink-0 flex-col items-center justify-center gap-1 px-2 py-4 text-center sm:w-36 ${WARNA[golonganMapel(p.mapel)]}`} aria-hidden>
                    <Ikon size={36} strokeWidth={1.75} />
                    <span className="mt-1 text-xs font-semibold tracking-widest opacity-70">TO TKA</span>
                    <span className="break-words text-base font-bold leading-tight">{p.mapel}</span>
                  </div>
                  <div className="min-w-[12rem] flex-1 px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.kelas}`}>{st.teks}</span>
                    <p className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-gray-900">{p.judul}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Kapsul>
                        {p.jenjang}
                        {p.kelas ? ` · Kelas ${p.kelas}` : ''} · TA {tahunAjaran(p.bukaPada ?? sekarangServer)}
                      </Kapsul>
                      {(p.menit || p.jumlahSoal) && (
                        <Kapsul>{[p.menit ? `${p.menit} menit` : null, p.jumlahSoal ? `${p.jumlahSoal} soal` : null].filter(Boolean).join(' · ')}</Kapsul>
                      )}
                    </div>
                    <p className="mt-2.5 flex min-w-0 items-center gap-1.5 text-sm text-gray-700">
                      <IkonKalender />
                      <span className="min-w-0">{tanggalPengerjaan(p)}</span>
                    </p>
                  </div>
                  {(p.keadaan === 'belum' || p.keadaan === 'selesai') && (
                    // Tiga kelompok dipisah garis: judul | skor | tombol. Di layar lebar berada di ujung kanan kartu,
                    // di layar sempit menjadi baris sendiri di dasar kartu.
                    <div className="flex w-full items-stretch border-t border-gray-100 sm:w-auto sm:border-l sm:border-t-0">
                      {p.keadaan === 'selesai' && p.nilai != null && (
                        <div className="flex flex-1 flex-col items-center justify-center px-5 py-3 text-center sm:flex-none">
                          <p className="text-xs text-gray-500">Skor akhir</p>
                          <p className="text-2xl font-semibold tabular-nums leading-tight text-gray-900">{fmtNilai(p.nilai as number)}</p>
                        </div>
                      )}
                      <div className={`flex flex-1 items-center justify-center px-5 py-3 sm:flex-none ${p.keadaan === 'selesai' && p.nilai != null ? 'border-l border-gray-100' : ''}`}>
                        {p.keadaan === 'belum' ? (
                          <TombolMulai href={p.hrefMulai} bukaPada={p.bukaPada} tutupPada={p.tutupPada} sekarangServer={sekarangServer} lewati={lewatiJadwal} />
                        ) : (
                          <Link href={p.hrefHasil} className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                            Cek Pembahasan
                          </Link>
                        )}
                      </div>
                    </div>
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
