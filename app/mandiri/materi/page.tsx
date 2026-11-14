import Link from 'next/link'
import { redirect } from 'next/navigation'
import { mandiriContext } from '@/lib/mandiri'
import { HTML_AC01 } from '@/lib/materi-interaktif/ac01'
import PenampilMateri from '@/components/belajar/PenampilMateri'

/**
 * Materi untuk pelanggan langganan. Hari ini satu: AC-01, "Ikat Sepuluh"
 * (bilangan cacah sampai 100). Materi interaktif ini halaman HTML mandiri,
 * dimuat di iframe `sandbox="allow-scripts"` — tanpa `allow-same-origin`,
 * jadi skripnya tidak bisa menyentuh sesi atau cookie Tera.
 *
 * Ikut hak pakai SORA, seperti Misi: tanpa langganan aktif, dialihkan ke
 * halaman langganan.
 */
export default async function MateriMandiriPage() {
  const { produk } = await mandiriContext()
  if (!produk.sora) redirect('/mandiri/langganan')

  return (
    <div className="space-y-3">
      <div>
        <Link href="/mandiri" className="text-sm text-gray-500 hover:text-gray-900">
          ← Beranda
        </Link>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Materi</h1>
        <p className="text-sm text-gray-500 mt-0.5">AC-01 · Bilangan cacah sampai 100</p>
      </div>
      <PenampilMateri
        html={HTML_AC01}
        judul="Ikat Sepuluh — AC-01"
        hrefLatihan="/belajar/misi/AC-01"
      />
    </div>
  )
}
