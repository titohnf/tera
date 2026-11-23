import Link from 'next/link'
import { redirect } from 'next/navigation'
import { mandiriContext } from '@/lib/mandiri'
import { alamatMateri } from '@/lib/belajar/alamat-materi'
import { daftarMateriInteraktif } from '@/lib/materi-interaktif'

/**
 * Daftar materi interaktif untuk pelanggan langganan.
 *
 * Materi sebenarnya adalah langkah pertama SEBUAH TOPIK Misi (lihat
 * `IsiTopikMisi`), bukan menu yang berdiri sendiri; halaman ini perpustakaan
 * untuk anak yang ingin mengulang. Ikut hak pakai SORA: tanpa langganan aktif,
 * dialihkan ke halaman langganan.
 */
export default async function MateriMandiriPage() {
  const { produk } = await mandiriContext()
  if (!produk.sora) redirect('/mandiri/langganan')

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-500 mt-0.5">Belajar dulu, baru berlatih.</p>
      </div>
      <ul className="space-y-2">
        {daftarMateriInteraktif.map(m => (
          <li key={m.kode}>
            <Link
              href={alamatMateri(null, m.kode)}
              className="block rounded-xl bg-white p-4 shadow-kartu transition hover:bg-slate-50"
            >
              <span className="block text-xs text-gray-400">{m.kode}</span>
              <span className="block text-base font-semibold tracking-tight text-gray-900">
                {m.judul}
              </span>
              <span className="block text-sm text-gray-500">{m.ringkas}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
