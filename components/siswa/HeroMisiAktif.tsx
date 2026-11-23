'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import SheetTopik from '@/components/belajar/misi/SheetTopik'
import { gayaTema } from '@/components/belajar/misi/gaya'
import { ringkasKartu } from '@/components/belajar/misi/bahan'
import Ikon3D from '@/components/ui/Ikon3D'
import { PitaKemajuan, TombolTebing } from '@/components/ui/desain'
import type { MisiAktif } from '@/lib/siswa/misi-aktif'

/**
 * Hero beranda saat yang paling pantas dikerjakan adalah Misi: kartu topik yang
 * sedang aktif — topik yang SAMA dengan "Misi hari ini" di halaman Misi (aturan
 * pemilihannya satu: `pilihTopikSekarang`) — berwarna tema topiknya. Satu tombol,
 * "Pilih level", membuka lembar topik (bottom sheet) di tempat, tanpa pindah
 * halaman; "Mulai Level N" ada di lembar itu.
 *
 * Kartunya tidak bergerak saat disentuh; hanya tombolnya yang "dipencet"
 * (docs/desain-siswa.md). Seluruh kartu tetap bisa diketuk untuk membuka lembar.
 */
export default function HeroMisiAktif({ data, anak }: { data: MisiAktif; anak: string }) {
  const [buka, setBuka] = useState(false)
  const { sekarang: t, langkah, paket, namaTopik, kelas, hariIni, kemajuan } = data
  const g = gayaTema(t.elemen)
  const kabar = ringkasKartu(t, langkah, paket, hariIni)
  const persen = kemajuan.total > 0 ? Math.round((kemajuan.tuntas / kemajuan.total) * 100) : 0

  return (
    <>
      <div
        className="cursor-pointer rounded-2xl p-5 text-white"
        style={{ background: g.dasar }}
        onClick={() => setBuka(true)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">Misi hari ini</span>
            <h2 className="mt-2.5 text-2xl font-extrabold leading-tight tracking-tight">{t.nama}</h2>
            {kabar && <p className="mt-1 text-sm font-semibold leading-snug text-white/85">{kabar}</p>}
          </div>
          <Ikon3D nama="rocket-biru" ukuran={64} />
        </div>

        <div className="mt-4">
          <p className="flex items-baseline gap-1.5 text-white/90">
            <span className="text-3xl font-extrabold tabular-nums leading-none text-white">{kemajuan.tuntas}</span>
            <span className="text-base font-bold tabular-nums text-white/70">/ {kemajuan.total}</span>
            <span className="ml-1 text-sm font-semibold">topik Matematika tuntas</span>
          </p>
          <div className="mt-2">
            <PitaKemajuan persen={Math.max(persen, kemajuan.tuntas > 0 ? 5 : 0)} pada="warna" />
          </div>
        </div>

        <div className="mt-5">
          <TombolTebing varian="putih" tebing={g.tua} kelas="!text-slate-900">
            Pilih level
            <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden />
          </TombolTebing>
        </div>
      </div>

      <SheetTopik
        topik={buka ? t : null}
        langkah={langkah}
        paket={paket}
        namaTopik={new Map(namaTopik)}
        kelas={kelas}
        anak={anak}
        hariIni={hariIni}
        onTutup={() => setBuka(false)}
      />
    </>
  )
}
