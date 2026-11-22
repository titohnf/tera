import RemahRoti from '@/components/siswa/RemahRoti'
import { umumContext } from '@/lib/umum'
import { tautanWaAdmin } from '@/lib/kontak'

export const metadata = { title: 'Langganan' }

export default async function LanggananUmum() {
  const { kode, nama } = await umumContext()
  return (
    <div className="space-y-5">
      <RemahRoti item={[{ label: 'Beranda', href: '/umum' }, { label: 'Langganan' }]} />
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Berlangganan Tera</h1>
        <p className="mt-0.5 text-sm text-gray-500">Buka semua yang terkunci di berandamu.</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow ring-1 ring-gray-900/5 space-y-3 text-sm text-gray-700">
        <p><b>Misi</b> — paket latihan bertingkat per topik, dari dasar sampai Tantangan Akhir.</p>
        <p><b>Materi</b> — belajar konsep lewat halaman interaktif.</p>
        <p className="text-gray-500">Seluruh riwayat try out yang sudah kamu kerjakan ikut tersimpan di akunmu.</p>
        <a
          href={tautanWaAdmin(`Halo Bimbel Tera, saya ${nama} (kode peserta ${kode}). Saya ingin tahu info berlangganan Tera.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          Tanya info langganan lewat WhatsApp
        </a>
      </div>
    </div>
  )
}
