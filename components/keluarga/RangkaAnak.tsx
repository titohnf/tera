'use client'

import { usePathname } from 'next/navigation'
import BottomNav from '@/components/keluarga/BottomNav'

/**
 * Badan halaman anak beserta bilah navigasi bawahnya — atau tanpa bilah itu.
 *
 * Empat layar dibuka HANYA dari petak ikon di beranda: Tagihan, Laporan,
 * Kelas — dan Laporan sendiri membawa dua tab (Aktivitas Kelas dan Kompetensi)
 * di bawah satu alamat yang sama. Semuanya sudah membawa panah kembali ke
 * beranda di kepala layar, dan bilah bawah di sana tidak menawarkan apa pun yang
 * belum ada — "Beranda"-lah yang menyala, yaitu persis tujuan panah yang sudah
 * berdiri di pojok kiri atas. Dua kendali menuju tempat yang sama, satu di
 * antaranya memakan 56px di dasar setiap layar yang isinya justru panjang
 * (daftar tagihan, daftar sesi, tabel penguasaan).
 *
 * Yang MEMPERTAHANKAN bilahnya adalah layar-layar yang jadi tujuan bilah itu
 * sendiri — Beranda, Notifikasi, Profil — tempat ia berfungsi sebagai penanda
 * "saya sedang di mana", bukan sekadar jalan pulang.
 *
 * Keputusannya diambil di sini, bukan di dalam `BottomNav`, karena ruang bawah
 * (`pb-20`) harus ikut hilang bersama bilahnya; `BottomNav` yang memulangkan
 * null sendiri akan meninggalkan 80px kosong di dasar layar. Satu tempat yang
 * tahu, satu daftar yang menentukan.
 */
const TANPA_BILAH = ['/tagihan', '/laporan', '/jadwal', '/penguasaan']

export default function RangkaAnak({
  studentId,
  idNotifikasi,
  children,
}: {
  studentId: string
  idNotifikasi: string[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const awalan = `/keluarga/${studentId}`
  const sisa = pathname.startsWith(awalan) ? pathname.slice(awalan.length) : ''
  const berbilah = !TANPA_BILAH.some((p) => sisa.startsWith(p))

  return (
    <>
      <main
        /* `pb-20` menyisakan ruang untuk bilah yang melayang di dasar layar;
           tanpa itu kartu terakhir tertutup olehnya. Ia ikut hilang di layar
           yang tidak berbilah — ruang kosong tanpa apa-apa di bawahnya cuma
           membuat halaman tampak belum selesai dimuat. */
        className={`max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 ${berbilah ? 'pb-20' : ''}`}
      >
        {children}
      </main>

      {berbilah && <BottomNav studentId={studentId} idNotifikasi={idNotifikasi} />}
    </>
  )
}
