import { mandiriContext } from '@/lib/mandiri'
import KartuAplikasi, { IKON_GAMA, IKON_SORA } from '@/components/apps/KartuAplikasi'

/**
 * Beranda pelanggan langganan: kartu produk yang sadar hak pakai.
 *
 * Kartunya sama persis dengan yang dipakai beranda anak di portal keluarga
 * (`components/apps/KartuAplikasi`). Itu bukan penghematan kode, melainkan
 * janji: SORA harus terlihat seperti satu produk yang sama, siapa pun yang
 * membukanya.
 *
 * Kartu yang belum aktif tetap TAMPIL, tidak disembunyikan — pembaca yang tidak
 * melihat GAMA sama sekali tidak tahu ada yang bisa ditunggu, dan pembaca yang
 * tidak melihat SORA tidak tahu ada yang bisa dibeli. Yang berubah cuma
 * tujuannya: ke halaman langganan, bukan ke latihan.
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

      <KartuAplikasi
        nama="GAMA"
        keterangan="Segera hadir"
        teks="Game matematika."
        href={null}
        warna="bg-slate-100 text-slate-400"
        ikon={IKON_GAMA}
      />
    </div>
  )
}
