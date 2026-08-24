import { keluargaContext } from '@/lib/keluarga'
import HeaderKeluarga from '@/components/keluarga/HeaderKeluarga'

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
 * `keluargaContext()` tetap dipanggil meski namanya tidak lagi ditampilkan: ia
 * yang memastikan yang membuka rute ini memang akun ber-role `parent`.
 */
export default async function KeluargaLayout({ children }: { children: React.ReactNode }) {
  await keluargaContext()

  return (
    <div className="min-h-screen bg-slate-100">
      <HeaderKeluarga />
      {/* Tanpa `main` di sini: bilah pemilih anak dan bilah navigasi bawah
          menempel ke tepi layar, jadi yang memasang lebar dan padding isi
          adalah `app/keluarga/[studentId]/layout.tsx` — di dalam bilah-bilah
          itu, bukan di luarnya. */}
      {children}
    </div>
  )
}
