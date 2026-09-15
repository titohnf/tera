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
 * Latarnya `bg-slate-50` dan kartunya putih berbayang tipis — mengikuti portal
 * keluarga, yang memakai warna yang sama di semua layar KECUALI berandanya
 * (lihat `components/keluarga/RangkaAnak`). Permukaan ini dijangkau dari petak
 * "Belajar" di beranda itu, jadi keduanya harus tampak satu aplikasi; latar
 * yang berbeda akan terasa seperti berpindah aplikasi di tengah satu tugas.
 *
 * Tidak ada pengecualian "beranda" di sini: permukaan belajar tidak punya
 * layar muka berkartu warna seperti beranda keluarga — semuanya daftar dan
 * kartu putih, yang justru butuh latar bernada untuk memisahkannya.
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
      <div className="min-h-screen bg-slate-50">
        <KepalaBelajar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
      </div>
    </PenyediaKepala>
  )
}
