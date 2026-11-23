'use client'

import { useState } from 'react'
import SheetTopik from '@/components/belajar/misi/SheetTopik'
import KartuMisiHariIni from '@/components/belajar/misi/KartuMisiHariIni'
import type { MisiAktif } from '@/lib/siswa/misi-aktif'

/**
 * Hero beranda saat yang paling pantas dikerjakan adalah Misi: kartu "Misi hari
 * ini" yang PERSIS sama dengan di halaman Misi (`KartuMisiHariIni`, topik yang
 * dipilih aturan yang sama: `pilihTopikSekarang`) — termasuk tombol "Lihat materi"
 * dan "Mulai Level N", jadi anak bisa belajar materinya dari beranda.
 *
 * Mengetuk badan kartu (di luar tombol) membuka lembar topik (bottom sheet) untuk
 * memilih level, di tempat, tanpa pindah halaman.
 */
export default function HeroMisiAktif({ data, anak }: { data: MisiAktif; anak: string }) {
  const [buka, setBuka] = useState(false)
  const { sekarang: t, langkah, paket, namaTopik, kelas, hariIni, adaMateri } = data

  return (
    <>
      <div
        className="cursor-pointer"
        onClick={(e) => {
          // Tombol dan tautan di dalam kartu punya aksinya sendiri.
          if ((e.target as HTMLElement).closest('a, button')) return
          setBuka(true)
        }}
      >
        <KartuMisiHariIni topik={t} langkah={langkah} paket={paket} anak={anak} hariIni={hariIni} adaMateri={adaMateri} />
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
