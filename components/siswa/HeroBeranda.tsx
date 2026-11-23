import Link from 'next/link'
import { PitaKemajuan, TombolTebing } from '@/components/ui/desain'
import Ikon3D, { type NamaIkon3D } from '@/components/ui/Ikon3D'
import type { SesiTertunda } from '@/lib/belajar/sesi'

/**
 * Satu elemen berani di beranda siswa: apa yang paling pantas dikerjakan SEKARANG.
 * Urutannya (dipilih halaman): latihan yang tertunda, try out yang sedang
 * dibuka, lalu kemajuan Misi. Berlatar Biru Tera — warna aksi utama.
 *
 * Kartunya sendiri TIDAK bergerak saat disentuh; hanya tombol di dalamnya yang
 * "dipencet" (docs/desain-siswa.md). Angka kemajuan jadi bintangnya, dengan pita
 * yang selalu terlihat sedikit isinya begitu ada yang sudah dikerjakan.
 */
export type IsiHero =
  | { jenis: 'lanjut'; sesi: SesiTertunda }
  | { jenis: 'tryout'; label: string; teks: string; href: string }
  | { jenis: 'misi'; href: string; kemajuan: { tuntas: number; total: number } | null }

export default function HeroBeranda({ isi }: { isi: IsiHero }) {
  let judul: string
  let baris: string
  let href: string
  let tombol: string
  let ikon: NamaIkon3D = 'rocket'
  let angka: { besar: number; total: number; label: string } | null = null

  if (isi.jenis === 'lanjut') {
    const s = isi.sesi
    judul = s.tinggalHasil ? 'Lihat hasil latihanmu' : 'Lanjutkan latihanmu'
    baris = [s.mapel, s.jenjang, s.topik].filter(Boolean).join(' · ')
    angka = { besar: s.sudahDijawab, total: s.jumlahSoal, label: 'soal terjawab' }
    href = `/belajar/${s.sesiId}`
    tombol = s.tinggalHasil ? 'Lihat hasil' : 'Lanjutkan'
    ikon = 'memo-bk'
  } else if (isi.jenis === 'tryout') {
    judul = 'Try Out sedang dibuka'
    baris = isi.teks
    href = isi.href
    tombol = 'Kerjakan sekarang'
    ikon = 'trophy-bk'
  } else {
    const k = isi.kemajuan
    judul = k && k.tuntas > 0 ? 'Lanjutkan Misimu' : 'Mulai Misi pertamamu'
    baris = 'Matematika'
    angka = k ? { besar: k.tuntas, total: k.total, label: 'topik tuntas' } : null
    href = isi.href
    tombol = k && k.tuntas > 0 ? 'Lanjut Misi' : 'Mulai Misi'
  }

  const persen = angka && angka.total > 0 ? Math.round((angka.besar / angka.total) * 100) : 0

  return (
    <Link href={href} className="block rounded-2xl bg-tera p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{judul}</h2>
          {baris && <p className="mt-1 truncate text-sm font-semibold text-white/85">{baris}</p>}
        </div>
        <Ikon3D nama={ikon} ukuran={64} />
      </div>

      {angka && (
        <div className="mt-4">
          <p className="flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tabular-nums leading-none">{angka.besar}</span>
            <span className="text-xl font-bold tabular-nums text-white/70">/ {angka.total}</span>
            <span className="ml-1 text-sm font-semibold text-white/85">{angka.label}</span>
          </p>
          <div className="mt-2.5">
            <PitaKemajuan persen={Math.max(persen, angka.besar > 0 ? 5 : 0)} pada="warna" />
          </div>
        </div>
      )}

      <div className="mt-5">
        <TombolTebing varian="putih">{tombol}</TombolTebing>
      </div>
    </Link>
  )
}
