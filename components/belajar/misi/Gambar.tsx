import { ChartColumn, Hash, Lock, Shapes, Sparkles, Variable, type LucideIcon } from 'lucide-react'
import { temaTopik, type TemaTopik } from '@/lib/belajar/tema-topik'
import { EMAS, EMAS_TUA } from './gaya'
import { LencanaF } from './KonsepLencana2'

/**
 * Gambar-gambar layar Misi: bintang, maskot, dan ikon tema.
 *
 * SEMUANYA SVG SATU BERKAS, tanpa pustaka gambar dan tanpa emoji: emoji
 * dirender sistem operasi sehingga rupanya lain di tiap ponsel, dan bocah yang
 * memegang ponsel murah tidak boleh melihat kotak kosong di tempat bintang.
 * Semuanya `aria-hidden` — kabarnya selalu tertulis juga dalam kata.
 */

/** Titik-titik bintang lima sudut berpusat di (50,50). */
const TITIK_BINTANG = Array.from({ length: 10 }, (_, k) => {
  const r = k % 2 === 0 ? 40 : 19
  const sudut = (-90 + k * 36) * (Math.PI / 180)
  return `${(50 + r * Math.cos(sudut)).toFixed(2)},${(50 + r * Math.sin(sudut)).toFixed(2)}`
}).join(' ')

export function Bintang({
  menyala,
  ukuran = 16,
  kelas = '',
  diAtasWarna = false,
}: {
  menyala: boolean
  ukuran?: number
  kelas?: string
  /** Bintang kosong untuk latar berwarna: putih transparan, bukan abu terang. */
  diAtasWarna?: boolean
}) {
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden className={kelas}>
      <polygon
        points={TITIK_BINTANG}
        fill={menyala ? EMAS : diAtasWarna ? 'rgba(0,0,0,0.28)' : '#E2E8F0'}
        stroke={menyala ? EMAS_TUA : diAtasWarna ? 'rgba(0,0,0,0.0)' : '#CBD5E1'}
        strokeWidth={8}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  )
}

/** Deret tiga bintang; yang menyala sebanyak `jumlah`. */
export function TigaBintang({
  jumlah,
  ukuran = 16,
  diAtasWarna = false,
}: {
  jumlah: number
  ukuran?: number
  diAtasWarna?: boolean
}) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map(i => (
        <Bintang key={i} menyala={i < jumlah} ukuran={ukuran} diAtasWarna={diAtasWarna} />
      ))}
    </span>
  )
}

/**
 * Maskot: bintang emas yang tersenyum. Satu wajah untuk seluruh layar Misi, jadi
 * anak merasa ada yang menemaninya, bukan daftar yang menunggu diisi.
 */
export function Maskot({ ukuran = 96, kelas = '' }: { ukuran?: number; kelas?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden className={kelas}>
      <polygon
        points={TITIK_BINTANG}
        fill={EMAS}
        stroke="#FDE68A"
        strokeWidth={10}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <circle cx="41" cy="49" r="3.6" fill="#78350F" />
      <circle cx="59" cy="49" r="3.6" fill="#78350F" />
      <circle cx="42.2" cy="47.8" r="1.1" fill="#fff" />
      <circle cx="60.2" cy="47.8" r="1.1" fill="#fff" />
      <path
        d="M43 57 Q50 65 57 57"
        fill="none"
        stroke="#78350F"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="35" cy="56" r="4" fill="#F472B6" opacity="0.45" />
      <circle cx="65" cy="56" r="4" fill="#F472B6" opacity="0.45" />
    </svg>
  )
}

const IKON: Record<TemaTopik, LucideIcon> = {
  bilangan: Hash,
  aljabar: Variable,
  geometri_pengukuran: Shapes,
  data_peluang: ChartColumn,
  lainnya: Sparkles,
}

export function IkonTemaPutih({
  elemen,
  ukuran = 32,
  terkunci = false,
}: {
  elemen: string | null | undefined
  ukuran?: number
  terkunci?: boolean
}) {
  const Ikon = terkunci ? Lock : IKON[temaTopik(elemen)]
  return <Ikon size={ukuran} strokeWidth={2.4} aria-hidden />
}

export function Centang({ ukuran = 14 }: { ukuran?: number }) {
  return (
    <svg viewBox="0 0 12 12" width={ukuran} height={ukuran} fill="none" aria-hidden>
      <path
        d="M2.5 6.5 5 9l4.5-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * LENCANA PANGKAT: segi enam. Kelas 1–3 chevron, kelas 4 chevron + diamond, kelas 5+ permata
 * (diamond, segi lima, segi enam, bintang) dengan sayap dan pita yang makin rumit.
 * Gambarnya ada di `KonsepLencana.tsx`.
 */
export function LencanaPangkat({
  kelas,
  ukuran = 52,
  redup = false,
}: {
  kelas: number | null
  ukuran?: number
  redup?: boolean
}) {
  const k = kelas != null && kelas >= 1 && kelas <= 12 ? kelas : 1
  return (
    <span className="flex shrink-0 items-center justify-center" aria-hidden>
      <LencanaF kelas={k} ukuran={ukuran} aktif={!redup} />
    </span>
  )
}
