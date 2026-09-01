'use client'

import { usePulangKe, usePemilihKepala } from './Kepala'
import type { Anak } from '@/lib/keluarga'

/**
 * Mengarahkan tombol kembali di header ke halaman tertentu, sekaligus
 * memasang pemilih anak di ujung kanan header.
 *
 * Komponen nol-byte — tidak merender apa pun, cuma memasang efek samping
 * selama ia terpasang. Dipanggil dari halaman server yang tahu studentId
 * dan daftar anak tanpa harus mengubah layout belajar.
 */
export default function PulangKe({
  href,
  anak,
  aktif,
}: {
  href: string
  /** Seluruh anak keluarga ini — untuk pemilih di header. */
  anak: Anak[]
  /** Id anak yang sedang dibuka. */
  aktif: string
}) {
  usePulangKe(href)
  usePemilihKepala(anak, aktif)
  return null
}
