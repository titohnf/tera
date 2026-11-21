import Link from 'next/link'
import { umumContext } from '@/lib/umum'
import KartuAplikasi, { IKON_MATERI, IKON_MISI, IKON_SORA, IKON_TRYOUT } from '@/components/apps/KartuAplikasi'

/**
 * Beranda peserta umum (masuk dengan kode): empat kartu yang sama dengan
 * beranda langganan, tetapi hanya Try Out yang terbuka. Tiga lainnya TAMPIL
 * terkunci dan menuju halaman langganan — yang tidak melihatnya tidak tahu ada
 * yang bisa didapat.
 */
export default async function BerandaUmum() {
  const { namaPendek } = await umumContext()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Halo, {namaPendek}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih yang mau kamu kerjakan hari ini.</p>
      </div>

      <KartuAplikasi nama="Latihan Soal" keterangan="Belum aktif" teks="Aktifkan langganan untuk mulai berlatih." href="/umum/langganan" warna="bg-slate-100 text-slate-400" ikon={IKON_SORA} />
      <KartuAplikasi nama="Misi" keterangan="Belum aktif" teks="Aktifkan langganan untuk membuka Misi." href="/umum/langganan" warna="bg-slate-100 text-slate-400" ikon={IKON_MISI} />
      <KartuAplikasi nama="Materi" keterangan="Belum aktif" teks="Aktifkan langganan untuk membuka Materi." href="/umum/langganan" warna="bg-slate-100 text-slate-400" ikon={IKON_MATERI} />
      <KartuAplikasi nama="Try Out" teks="Kerjakan try out TKA dan lihat hasilnya." href="/umum/tryout" warna="bg-violet-50 text-violet-600" ikon={IKON_TRYOUT} />

      <p className="pt-2 text-center text-sm text-gray-500">
        Mau akunmu lebih aman dan siap berlangganan?{' '}
        <Link href="/umum/akun" className="font-medium text-blue-600 hover:underline">
          Tambahkan email dan password
        </Link>
      </p>
    </div>
  )
}
