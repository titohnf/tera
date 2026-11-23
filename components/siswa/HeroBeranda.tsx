import Link from 'next/link'
import { PitaKemajuan, TombolTebing } from '@/components/ui/desain'
import type { SesiTertunda } from '@/lib/belajar/sesi'

/**
 * Satu elemen berani di beranda siswa: apa yang paling pantas dikerjakan SEKARANG.
 * Urutannya (dipilih halaman): latihan yang tertunda, try out yang sedang
 * dibuka, lalu kemajuan Misi. Berlatar Biru Tera — warna aksi utama — dengan
 * satu tombol bertebing; selebihnya halaman dibiarkan tenang.
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
  let persen: number | null = null

  if (isi.jenis === 'lanjut') {
    const s = isi.sesi
    const keterangan = [s.mapel, s.jenjang, s.topik].filter(Boolean).join(' · ')
    persen = s.jumlahSoal > 0 ? Math.min(100, Math.round((s.sudahDijawab / s.jumlahSoal) * 100)) : 0
    judul = s.tinggalHasil ? 'Lihat hasil latihanmu' : 'Lanjutkan latihanmu'
    baris = [keterangan, s.tinggalHasil ? `${s.jumlahSoal} soal terjawab` : `${s.sudahDijawab} dari ${s.jumlahSoal} soal terjawab`].filter(Boolean).join(' · ')
    href = `/belajar/${s.sesiId}`
    tombol = s.tinggalHasil ? 'Lihat hasil' : 'Lanjutkan'
  } else if (isi.jenis === 'tryout') {
    judul = 'Try Out sedang dibuka'
    baris = isi.teks
    href = isi.href
    tombol = 'Kerjakan sekarang'
  } else {
    const k = isi.kemajuan
    judul = k && k.tuntas > 0 ? 'Lanjutkan Misimu' : 'Mulai Misi pertamamu'
    baris = k ? `${k.tuntas} dari ${k.total} topik Matematika tuntas` : 'Naik level topik demi topik, kumpulkan bintangnya.'
    persen = k && k.total > 0 ? Math.round((k.tuntas / k.total) * 100) : null
    href = isi.href
    tombol = k && k.tuntas > 0 ? 'Lanjut Misi' : 'Mulai Misi'
  }

  return (
    <Link href={href} className="tebing block rounded-2xl bg-tera p-5 text-white">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{judul}</h2>
      <p className="mt-1 text-sm font-medium leading-snug text-white/85">{baris}</p>
      {persen !== null && (
        <div className="mt-4">
          <PitaKemajuan persen={persen} pada="warna" />
        </div>
      )}
      <div className="mt-5">
        <TombolTebing varian="putih">{tombol}</TombolTebing>
      </div>
    </Link>
  )
}
