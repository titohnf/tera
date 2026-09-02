import { keluargaContext } from '@/lib/keluarga'
import HeaderKeluarga from '@/components/keluarga/HeaderKeluarga'
// Rumus di soal dirender KaTeX, dan tanpa gayanya pecahan tampil sebagai deret
// angka: "2¼" jadi "2 241". Portal ini menampilkan soal sejak ada rute
// peninjauan orang tua (`penguasaan/[groupId]/soal`), jadi gayanya harus ikut
// di sini — kembarannya sudah lama ada di `app/belajar/layout.tsx`.
import 'katex/dist/katex.min.css'

/**
 * Rangka terluar portal keluarga.
 *
 * Isi bilah atasnya ditentukan `HeaderKeluarga` — logo di beranda, nama layar
 * di halaman lain — karena yang menentukan itu adalah rute yang sedang dibuka,
 * dan rute itu hanya diketahui di browser.
 *
 * Menu avatar yang dulu ada di pojok kanan atas — "Profil Saya" dan "Keluar" —
 * sudah dilepas. Portal ini punya "Profil" di bilah navigasi bawah, jadi
 * keduanya adalah pintu ke tempat yang sama, dan yang di pojok atas justru yang
 * paling jauh dari ibu jari di ponsel. "Keluar" pindah ke dasar halaman Profil
 * (`components/apps/KartuAkun`) — ia satu-satunya pemanggil `signOut()`
 * yang tersisa untuk keluarga, jadi ia tidak boleh ikut hilang.
 *
 * Latarnya PUTIH, dan itu menentukan bentuk seluruh portal. Sebelumnya ia abu
 * muda (`bg-slate-100`) dengan kartu putih melayang di atasnya — pola aplikasi
 * bawaan iOS. Kartunya tetap putih, dan yang memisahkannya dari latar sekarang
 * bayang paling tipis yang punya Tailwind: `shadow-kartu`, tanpa garis tepi.
 *
 * Dua aturan yang harus dijaga siapa pun yang menambah kartu di bawah rute ini:
 *
 * 1. Kartu memakai `shadow-kartu`, BUKAN garis dan bukan `shadow-sm` bawaan.
 *    Garis tepi menggambar kotak, dan lima kotak beruntun membuat halaman
 *    terbaca sebagai formulir. Bayang cuma mengangkat kartunya sedikit dari
 *    kertas — cukup untuk memisahkan, tidak cukup untuk menuntut perhatian.
 *
 * 2. Yang MELAYANG berbayang lebih tebal — popup pemilih anak, sheet saringan.
 *    Perbedaan ketebalannya yang mengatakan "ini di ATAS halaman, bukan bagian
 *    darinya"; bayang yang sama untuk keduanya menghapus pembedaan itu.
 *
 * Permukaan belajar (`app/belajar/layout.tsx`) mengikuti aturan yang sama, dan
 * memang harus: tab "Latihan" membawa orang ke sana tanpa meninggalkan portal,
 * jadi dua bahasa rupa yang berbeda akan terasa seperti pindah aplikasi.
 *
 * `keluargaContext()` tetap dipanggil meski nama keluarganya tidak lagi
 * ditampilkan: ia yang memastikan yang membuka rute ini memang akun ber-role
 * `parent`, dan sejak pemilih anak pindah ke pojok kanan header, ia pula yang
 * memasok daftar anaknya.
 */
export default async function KeluargaLayout({ children }: { children: React.ReactNode }) {
  const { anak } = await keluargaContext()

  return (
    <div className="min-h-screen bg-white">
      <HeaderKeluarga anak={anak} />
      {/* Tanpa `main` di sini: bilah navigasi bawah menempel ke tepi layar,
          jadi yang memasang lebar dan padding isi adalah
          `app/keluarga/[studentId]/layout.tsx` — di dalam bilah itu, bukan di
          luarnya. */}
      {children}
    </div>
  )
}
