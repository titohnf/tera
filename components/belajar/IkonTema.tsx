import { ChartColumn, Hash, Shapes, Sparkles, Variable, type LucideIcon } from 'lucide-react'
import { temaTopik, namaTema, type TemaTopik } from '@/lib/belajar/tema-topik'

/**
 * Ikon bulat untuk tema sebuah topik: garis tipis di atas lingkaran berwarna
 * lembut, keluarga yang sama dengan `IkonMapel`.
 *
 * Bukan emoji, dengan alasan yang sudah ditulis panjang di `IkonMapel`: emoji
 * dirender sistem operasi, jadi tebal-tipis dan warnanya berbeda di tiap
 * perangkat dan tidak satu pun mengikuti halaman ini.
 *
 * WARNANYA PEMBEDA, BUKAN HIASAN. Seluruh topik di peta ini satu mapel, jadi
 * ikon mapel tidak membedakan apa pun di sini — empat warna tema yang
 * membedakannya, dan tema yang sama selalu berwarna sama di seluruh layar.
 * Warnanya sengaja tidak memakai amber maupun emerald: di layar ini keduanya
 * sudah punya arti (saran prasyarat, dan tuntas), dan warna yang berarti dua
 * hal berhenti berarti apa pun.
 */
const IKON: Record<TemaTopik, LucideIcon> = {
  bilangan: Hash,
  // `Variable` — huruf x, lambang yang justru membedakan aljabar dari aritmetika
  // di mata anak yang baru bertemu keduanya.
  aljabar: Variable,
  geometri_pengukuran: Shapes,
  data_peluang: ChartColumn,
  lainnya: Sparkles,
}

const WARNA: Record<TemaTopik, string> = {
  bilangan: 'bg-sky-50 text-sky-600',
  aljabar: 'bg-violet-50 text-violet-600',
  geometri_pengukuran: 'bg-teal-50 text-teal-600',
  data_peluang: 'bg-rose-50 text-rose-600',
  lainnya: 'bg-slate-100 text-slate-500',
}

export default function IkonTema({
  elemen,
  size = 36,
  /**
   * Diberi label bacaan layar atau tidak.
   *
   * Bawaannya TIDAK: di baris peta, nama temanya sudah tertulis persis di
   * sebelahnya, dan pembaca layar yang mengucapkan "Bilangan" dua kali
   * berturut-turut cuma menambah kebisingan.
   */
  berlabel = false,
}: {
  elemen: string | null | undefined
  size?: number
  berlabel?: boolean
}) {
  const tema = temaTopik(elemen)
  const Ikon = IKON[tema]

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${WARNA[tema]}`}
      style={{ width: size, height: size }}
      {...(berlabel ? { role: 'img', 'aria-label': namaTema(elemen) } : { 'aria-hidden': true })}
    >
      <Ikon size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </span>
  )
}
