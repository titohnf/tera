'use client'

import Link from 'next/link'
import { alamatMisi } from '@/lib/belajar/alamat-misi'
import { alamatMateri } from '@/lib/belajar/alamat-materi'
import type { TopikPeta } from '@/lib/belajar/topik-peta'
import type { LangkahTopik, PaketRingkas } from '@/lib/belajar/langkah'
import { Maskot } from './Gambar'
import { gayaTema } from './gaya'
import { teksLangkah, ringkasKartu } from './bahan'
import { useMulaiLangkah } from './useMulaiLangkah'
import { PitaKemajuan } from '@/components/ui/desain'

/**
 * Kartu besar di puncak: satu misi, satu tombol.
 *
 * Belasan kartu yang sederajat memaksa anak memilih sebelum ia boleh bermain.
 * Kartu ini memilihkan — topik yang paling pantas dikerjakan sekarang — dan
 * tombolnya langsung membuka soal. Pilihan lain tetap ada di peta di bawahnya,
 * jadi ini TAWARAN, bukan pintu satu-satunya.
 *
 * Kalau langkahnya tidak bisa langsung dikerjakan (terkunci menunggu jeda,
 * atau semua paket selesai), tombolnya berubah jadi tautan ke halaman topik dan
 * kalimat di atasnya menjelaskan kenapa — kartu tidak pernah menjanjikan sesuatu
 * yang tidak bisa diketuk.
 */
export default function KartuMisiHariIni({
  topik: t,
  langkah,
  paket,
  anak,
  hariIni,
  adaMateri = false,
  progres,
}: {
  topik: TopikPeta
  langkah?: LangkahTopik
  paket: PaketRingkas[]
  anak: string | undefined
  hariIni: string
  /** Topik ini punya materi interaktif: tombol "Lihat materi" tampil di atas tombol mulai. */
  adaMateri?: boolean
  /** Kemajuan Misi (topik tuntas dari seluruhnya), hanya dipakai beranda siswa; halaman Misi tidak mengirimnya. */
  progres?: { tuntas: number; total: number }
}) {
  const g = gayaTema(t.elemen)
  const { galat, sibuk, mulai } = useMulaiLangkah(anak)
  const langsung = langkah != null && langkah.paketId != null && !langkah.terkunci
  const alamat = alamatMisi(anak, t.id)
  const kabar = ringkasKartu(t, langkah, paket, hariIni)

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 text-white"
      style={{
        background: `linear-gradient(135deg, ${g.dasar} 0%, ${g.tua} 100%)`,
        boxShadow: `0 6px 0 ${g.tua}, 0 14px 24px rgba(15,23,42,0.18)`,
      }}
    >
      {/* Lingkaran hiasan, di belakang teks: memberi kedalaman tanpa gambar berat. */}
      <span
        className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10"
        aria-hidden
      />

      <Maskot ukuran={84} kelas="misi-melayang pointer-events-none absolute right-3 top-3" />

      <div className="relative">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
          Misi hari ini
        </span>

        <h2 className="mt-3 max-w-[72%] text-2xl font-extrabold leading-tight">{t.nama}</h2>
        {kabar && <p className="mt-1 text-sm font-semibold text-white/80">{kabar}</p>}

        {progres && progres.total > 0 && (
          <div className="mt-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tabular-nums leading-none">{progres.tuntas}</span>
              <span className="text-base font-bold tabular-nums text-white/70">/ {progres.total}</span>
              <span className="ml-1 text-sm font-semibold text-white/85">topik tuntas</span>
            </p>
            <div className="mt-2">
              <PitaKemajuan persen={Math.max(Math.round((progres.tuntas / progres.total) * 100), progres.tuntas > 0 ? 5 : 0)} pada="warna" />
            </div>
          </div>
        )}

        {galat && (
          <p className="mt-3 rounded-xl bg-white/95 p-3 text-sm font-semibold text-amber-800">
            {galat}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {adaMateri && (
            <Link
              href={alamatMateri(anak, t.id)}
              className="block w-full rounded-2xl bg-white/20 px-5 py-3 text-center text-base font-extrabold text-white transition active:bg-white/30"
            >
              Lihat materi
            </Link>
          )}
          {langsung ? (
            <button
              type="button"
              disabled={sibuk}
              onClick={() => mulai(t.id)}
              className="misi-tombol w-full rounded-2xl bg-white px-5 py-4 text-lg font-extrabold disabled:opacity-70"
              style={{ color: g.tua, boxShadow: '0 5px 0 rgba(15,23,42,0.28)' }}
            >
              {sibuk ? 'Menyiapkan soal…' : teksLangkah(langkah)}
            </button>
          ) : (
            alamat && (
              <Link
                href={alamat}
                className="misi-tombol block w-full rounded-2xl bg-white px-5 py-4 text-center text-lg font-extrabold"
                style={{
                  color: g.tua,
                  boxShadow: '0 5px 0 rgba(15,23,42,0.28)',
                }}
              >
                Lihat topik
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
