import { mandiriContext } from '@/lib/mandiri'
import KartuAplikasi from '@/components/apps/KartuAplikasi'

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

      {/* Misi: peta kompetensi Matematika, bagian dari langganan; ikut aktif/tidaknya `produk.sora`.
          Latihan Soal sengaja tidak ditawarkan di langganan (isinya belum rapi). Rutenya
          `/belajar/misi`, komponen yang sama dengan Misi keluarga. */}
      <KartuAplikasi
        nama="Misi"
        keterangan={produk.sora ? undefined : 'Belum aktif'}
        teks={
          produk.sora
            ? 'Naik level topik demi topik, kumpulkan bintangnya.'
            : 'Aktifkan langganan untuk membuka Misi.'
        }
        href={produk.sora ? '/belajar/misi' : '/mandiri/langganan'}
        terkunci={!produk.sora}
        ikon="star"
      />

      {/* Materi: belajar konsep lewat halaman interaktif (hari ini AC-01).
          Ikut hak pakai SORA, sama seperti Misi. */}
      <KartuAplikasi
        nama="Materi"
        keterangan={produk.sora ? undefined : 'Belum aktif'}
        teks={
          produk.sora
            ? 'Pelajari konsep lewat halaman interaktif yang seru.'
            : 'Aktifkan langganan untuk membuka Materi.'
        }
        href={produk.sora ? '/mandiri/materi' : '/mandiri/langganan'}
        terkunci={!produk.sora}
        ikon="light-bulb"
      />

      {/* Try Out: terbuka untuk semua akun, berlangganan atau tidak. Pintu bagi
          yang baru mencoba; dua kartu lain tetap mengikuti hak pakai. */}
      <KartuAplikasi
        nama="Try Out"
        teks="Uji kemampuanmu lewat try out TKA, lalu lihat skornya."
        href="/mandiri/tryout"
        ikon="trophy"
      />
    </div>
  )
}
