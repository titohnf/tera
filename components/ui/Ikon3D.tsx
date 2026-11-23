import Image from 'next/image'
import type { GolonganMapel } from '@/lib/belajar/ikon-mapel'

/**
 * Ikon 3D Tera Siswa: Microsoft Fluent Emoji (MIT), disalin ke `public/ikon/`
 * (lihat `LISENSI.txt` di sana). Satu keluarga gambar untuk seluruh aplikasi —
 * jangan mencampur sumber ikon 3D lain, gayanya akan bertabrakan.
 * Berakhiran `-bk`: versi biru + kuning (`scripts/warnai-ikon.py`) untuk ikon MENU.
 * `unoptimized`: berkasnya sudah kecil (256px, ±35 KB), dan pengoptimalan
 * gambar Vercel berkuota.
 */
export type NamaIkon3D =
  | 'memo'
  | 'memo-bk'
  | 'trophy-bk'
  | 'rocket'
  | 'rocket-biru'
  | 'layar-360'
  | 'trophy'
  | 'abacus'
  | 'open-book'
  | 'microscope'
  | 'seedling'
  | 'test-tube'
  | 'atom'
  | 'dna'
  | 'globe'
  | 'money-bag'
  | 'classical-building'
  | 'handshake'
  | 'folded-hands'
  | 'artist-palette'
  | 'soccer-ball'
  | 'laptop'
  | 'graduation-cap'
  | 'star'

/** Ikon sebuah golongan mapel. */
export const IKON_GOLONGAN: Record<GolonganMapel, NamaIkon3D> = {
  bahasa: 'open-book',
  matematika: 'abacus',
  sains: 'microscope',
  kimia: 'test-tube',
  fisika: 'atom',
  biologi: 'dna',
  bumi: 'globe',
  ipas: 'seedling',
  ekonomi: 'money-bag',
  sejarah: 'classical-building',
  sosial: 'handshake',
  agama: 'folded-hands',
  seni: 'artist-palette',
  olahraga: 'soccer-ball',
  komputer: 'laptop',
  umum: 'graduation-cap',
}

/** Ikon yang digambar sendiri (SVG), bukan dari Fluent Emoji (PNG). */
const IKON_SVG = new Set<NamaIkon3D>(['layar-360'])

export default function Ikon3D({
  nama,
  ukuran = 40,
  kelas = '',
}: {
  nama: NamaIkon3D
  ukuran?: number
  kelas?: string
}) {
  return (
    <Image
      src={`/ikon/${nama}.${IKON_SVG.has(nama) ? 'svg' : 'png'}`}
      alt=""
      width={ukuran}
      height={ukuran}
      unoptimized
      draggable={false}
      className={`shrink-0 select-none ${kelas}`}
      style={{ width: ukuran, height: ukuran }}
    />
  )
}
