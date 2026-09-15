'use client'

import { usePathname } from 'next/navigation'
import BottomNav from '@/components/keluarga/BottomNav'

/**
 * Badan halaman anak beserta bilah navigasi bawahnya — atau tanpa bilah itu.
 *
 * Beberapa layar dibuka HANYA dari petak ikon di beranda: Tagihan, Laporan,
 * Kelas — dan Laporan sendiri membawa tiga tab (Progres Kelas, Latihan Mandiri,
 * Ketuntasan Materi) yang digambar sebagai halaman terpisah di bawahnya.
 * Semuanya sudah membawa panah kembali ke beranda di kepala layar, dan bilah
 * bawah di sana tidak menawarkan apa pun yang belum ada — "Beranda"-lah yang
 * menyala, yaitu persis tujuan panah yang sudah berdiri di pojok kiri atas.
 * Dua kendali menuju tempat yang sama, satu di antaranya memakan 56px di dasar
 * setiap layar yang isinya justru panjang (daftar tagihan, daftar sesi, tabel
 * penguasaan).
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
const TANPA_BILAH = ['/tagihan', '/rapor', '/laporan', '/jadwal', '/penguasaan', '/ketuntasan']

/**
 * Latar layar: putih HANYA di beranda, abu paling muda di semua layar lain.
 *
 * Beranda hampir seluruhnya kartu berwarna dan petak ikon — ia tidak menuntut
 * latar untuk memisahkan apa pun, dan putih membuatnya terbaca sebagai halaman
 * muka, bukan sebagai daftar. Layar lain isinya justru kartu putih beruntun:
 * di atas latar putih, batas antar-kartu tinggal bergantung pada bayang
 * `shadow-kartu` yang memang sengaja dibuat setipis mungkin, dan pada layar
 * ponsel yang terang bayang setipis itu nyaris hilang. Abu satu langkah dari
 * putih mengembalikan batas itu tanpa menambah garis.
 *
 * `bg-slate-50` (#f8fafc), warna yang sudah dipakai di seluruh basis kode ini
 * untuk permukaan sekunder — baris tabel, keadaan tekan sebuah kartu. Ia
 * berbias biru tipis, dan itu memang terbaca di sebelah kartu putih murni;
 * yang didapat sebagai gantinya adalah satu warna abu untuk seluruh aplikasi
 * alih-alih dua yang berdekatan tapi tidak sama.
 */
const LATAR_BERANDA = 'bg-white'
const LATAR_LAYAR = 'bg-slate-50'

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
  // Beranda persis, bukan "berawalan beranda": tiap layar lain juga berawalan
  // sama, jadi yang dibandingkan harus sisa yang kosong.
  const beranda = sisa === '' || sisa === '/'

  return (
    /* `flex-1`, bukan `min-h-screen`: rangka ini berdiri DI BAWAH header
       setinggi 56px, jadi tinggi layar penuh di sini berarti halaman yang
       selalu bisa digulir 56px meski isinya pendek. Rantai fleksnya dipasang
       di `app/keluarga/layout.tsx`. */
    <div className={`flex flex-1 flex-col ${beranda ? LATAR_BERANDA : LATAR_LAYAR}`}>
      <main
        /* `pb-20` menyisakan ruang untuk bilah yang melayang di dasar layar;
           tanpa itu kartu terakhir tertutup olehnya. Ia ikut hilang di layar
           yang tidak berbilah — ruang kosong tanpa apa-apa di bawahnya cuma
           membuat halaman tampak belum selesai dimuat. */
        /* `w-full` WAJIB ada bersama `mx-auto` di sini. Pembungkusnya kolom
           fleks, dan pada flex item `margin: auto` di sumbu silang membatalkan
           `stretch`: tanpa lebar eksplisit, `main` menyusut seukuran isinya
           lalu dipusatkan — seluruh halaman jadi lebih sempit dari layarnya
           tanpa satu pun kelas yang menyebut lebar. */
        className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 ${berbilah ? 'pb-20' : ''}`}
      >
        {children}
      </main>

      {berbilah && <BottomNav studentId={studentId} idNotifikasi={idNotifikasi} />}
    </div>
  )
}
