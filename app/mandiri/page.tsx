import { mandiriContext } from '@/lib/mandiri'
import KartuAplikasi, { IKON_SORA } from '@/components/apps/KartuAplikasi'

/**
 * Beranda pelanggan langganan: kartu produk yang sadar hak pakai.
 *
 * Kartunya sama persis dengan yang dipakai beranda anak di portal keluarga
 * (`components/apps/KartuAplikasi`). Itu bukan penghematan kode, melainkan
 * janji: SORA harus terlihat seperti satu produk yang sama, siapa pun yang
 * membukanya.
 *
 * Kartu SORA yang belum aktif tetap TAMPIL, tidak disembunyikan — pembaca yang
 * tidak melihatnya tidak tahu ada yang bisa dibeli. Yang berubah cuma
 * tujuannya: ke halaman langganan, bukan ke latihan.
 *
 * GAMA turun dari sini bersamaan dengan turunnya dari beranda keluarga, dan
 * memang harus bersamaan: kedua beranda menampilkan produk yang sama, dan satu
 * kartu "Segera hadir" yang cuma terlihat oleh separuh pemakainya adalah
 * persis kembaran yang menyimpang, yang `KartuAplikasi` ada untuk mencegahnya.
 * Bedanya dengan SORA yang belum aktif: SORA sudah ada dan bisa dibeli hari
 * ini, sementara GAMA belum mulai dikerjakan — janji tanpa tanggal yang makin
 * lama makin terbaca sebagai bagian aplikasi yang rusak.
 */
export default async function BerandaMandiri() {
  const { namaPendek, produk } = await mandiriContext()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Halo, {namaPendek}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih yang mau kamu kerjakan hari ini.</p>
      </div>

      <KartuAplikasi
        nama="SORA"
        keterangan={produk.sora ? undefined : 'Belum aktif'}
        teks={
          produk.sora
            ? 'Latihan soal per topik, dengan pembahasan langsung.'
            : 'Aktifkan langganan untuk mulai berlatih.'
        }
        href={produk.sora ? '/belajar' : '/mandiri/langganan'}
        warna={produk.sora ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}
        ikon={IKON_SORA}
      />
    </div>
  )
}
