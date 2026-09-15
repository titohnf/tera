'use client'

import { usePulangKe, usePemilihKepala } from './Kepala'
import type { Anak } from '@/lib/keluarga'

/** Dipakai saat pemanggilnya tidak membawa daftar anak. Konstanta modul, bukan
    `[]` di badan fungsi: array baru tiap render akan memasang ulang efeknya
    tanpa henti. */
const TANPA_ANAK: Anak[] = []

/**
 * Mengarahkan tombol kembali di header ke halaman tertentu, dan — kalau daftar
 * anaknya dibawa — memasang pemilih anak di ujung kanan header.
 *
 * Komponen nol-byte — tidak merender apa pun, cuma memasang efek samping
 * selama ia terpasang. Dipanggil dari halaman server yang tahu studentId
 * dan daftar anak tanpa harus mengubah layout belajar.
 *
 * DAFTAR ANAKNYA OPSIONAL, karena tidak setiap layar punya alasan menebusnya.
 * Layar hasil cuma butuh arah pulang yang benar, dan memaksanya memanggil
 * `keluargaContext()` demi pemilih yang tidak diminta siapa pun adalah satu
 * kueri tambahan di jalur yang dilewati setiap anak, setiap paket.
 */
export default function PulangKe({
  href,
  anak,
  aktif,
}: {
  href: string
  /** Seluruh anak keluarga ini — untuk pemilih di header. Boleh kosong. */
  anak?: Anak[]
  /** Id anak yang sedang dibuka. */
  aktif?: string
}) {
  usePulangKe(href)
  // Header sendiri yang memutuskan tidak menggambar apa-apa untuk daftar
  // berisi kurang dari dua anak, jadi tidak ada cabang yang perlu ditulis di
  // sini — dan hook memang tidak boleh dipanggil bersyarat.
  usePemilihKepala(anak ?? TANPA_ANAK, aktif ?? '')
  return null
}
