'use client'

import BottomNav from '@/components/keluarga/BottomNav'
import type { Anak } from '@/lib/keluarga'
import { usePemilihKepala, useTanpaPulang } from './Kepala'

/**
 * Perabot portal keluarga yang dibawa ke permukaan belajar: bilah navigasi di
 * dasar layar, pemilih anak di ujung kanan header.
 *
 * Permukaan ini dipakai dua kalangan: keluarga bimbel, yang tiba dari petak
 * "Belajar" di berandanya, dan pelanggan langganan, yang tidak punya portal
 * semacam itu. Bilahnya karena itu dirender oleh HALAMAN, bukan oleh layout —
 * layout tidak menerima `?anak=`, dan hanya `belajarContext()` yang tahu jalur
 * mana yang sedang dibuka. Untuk pelanggan langganan komponen ini tidak pernah
 * dipasang.
 *
 * Ia sekaligus melepas tautan keluar di header: dengan bilah ini di layar,
 * "‹" di pojok kiri atas cuma kendali kedua menuju tempat yang sama, di pojok
 * yang justru dipakai `PemilihLatihan` untuk mundur selangkah.
 *
 * Pemilih anaknya dipasang dari sini juga, lewat konteks kepala — header
 * dirender oleh layout, yang tidak boleh memanggil `keluargaContext()` karena
 * ia melayani pelanggan langganan juga. `PemilihAnak` sendiri yang memutuskan
 * tidak menampakkan diri untuk keluarga beranak satu.
 *
 * Ruang kosong setinggi bilahnya ikut dirender di sini. `app/belajar/layout`
 * tidak tahu bilah ini akan muncul, jadi ia tidak bisa menyediakan `pb-20`
 * seperti rangka portal keluarga; tanpa ruang itu kartu terakhir di daftar
 * mapel tertutup separuh.
 */
export default function BilahKeluarga({
  studentId,
  idNotifikasi,
  anak,
}: {
  studentId: string
  idNotifikasi: string[]
  /** Seluruh anak keluarga ini — untuk pemilih di header. */
  anak: Anak[]
}) {
  useTanpaPulang()
  usePemilihKepala(anak, studentId)
  return (
    <>
      <div className="h-20" aria-hidden />
      <BottomNav studentId={studentId} idNotifikasi={idNotifikasi} />
    </>
  )
}
