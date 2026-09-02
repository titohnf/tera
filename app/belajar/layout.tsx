import { KepalaBelajar, PenyediaKepala } from '@/components/belajar/Kepala'
// Gaya KaTeX hanya dimuat di rute ini: soal berumus tidak pernah muncul di luar
// permukaan belajar, dan berkasnya bukan sesuatu yang pantas dibawa setiap
// halaman portal keluarga.
import 'katex/dist/katex.min.css'

/**
 * Rangka permukaan belajar — dipakai keluarga bimbel maupun pelanggan
 * langganan.
 *
 * Layout ini sengaja TIDAK memanggil `belajarContext()`. Konteks itu butuh
 * `?anak=` dari searchParams untuk jalur keluarga, dan layout di Next tidak
 * menerimanya; memaksakannya di sini berarti dua tempat yang menjawab
 * "atas nama siapa" — persis percabangan yang `lib/belajar.ts` ada untuk
 * mencegah. Penjagaannya tetap ada di setiap halaman di bawah rute ini, yang
 * memanggil `belajarContext()` sebagai baris pertamanya.
 *
 * Latar putih dan kartu bergaris-rambut mengikuti portal keluarga; aturannya
 * ditulis lengkap di `app/keluarga/layout.tsx`. Permukaan ini dibuka dari tab
 * "Latihan" milik portal itu, jadi keduanya harus tampak satu aplikasi.
 *
 * Bukan kelalaian, dan pola yang sama sudah dipakai portal keluarga:
 * `app/keluarga/[studentId]/layout.tsx` pun tidak diandalkan sendirian —
 * tiap halamannya memanggil `anakOrRedirect()` sendiri, dengan alasan yang
 * ditulis di sana: layout tidak dijalankan ulang saat berpindah antar halaman
 * di bawahnya, jadi ia bukan penjaga yang bisa diandalkan.
 */
export default function BelajarLayout({ children }: { children: React.ReactNode }) {
  return (
    <PenyediaKepala>
      <div className="min-h-screen bg-white">
        <KepalaBelajar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
      </div>
    </PenyediaKepala>
  )
}
