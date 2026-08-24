import Link from 'next/link'
import Image from 'next/image'
import { mandiriContext } from '@/lib/mandiri'

/**
 * Rangka portal pelanggan langganan.
 *
 * Berdiri terpisah dari `/belajar`, dan itu disengaja. `/belajar` adalah
 * PERMUKAAN yang dipakai dua kalangan — keluarga bimbel dan pelanggan;
 * `/mandiri` adalah RUMAH milik pelanggan saja, tempat GAMA nanti mendapat
 * kartunya sendiri di sebelah SORA. Menyatukan keduanya berarti pintu keluarga
 * menuju latihan ikut menyeret kerangka yang bukan miliknya.
 *
 * Penjaganya `mandiriContext()`, yang memakai client sesi supaya RLS-lah yang
 * benar-benar menahan — alasan yang sama dengan `lib/keluarga.ts`, dan lebih
 * berat di sini karena yang membuka halaman ini adalah orang yang mendaftar
 * sendiri.
 *
 * Tidak ada bilah navigasi bawah seperti portal keluarga: isinya baru dua
 * halaman, dan bilah berisi dua ikon lebih banyak menghabiskan ruang daripada
 * membantu. Ia ditambahkan kalau GAMA sudah punya halamannya sendiri.
 */
export default async function MandiriLayout({ children }: { children: React.ReactNode }) {
  const { namaPendek } = await mandiriContext()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 sm:px-6">
        <Link href="/mandiri" className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
          <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
          <span className="text-base text-gray-900">
            Bimbel <span className="font-semibold">Tera</span>
          </span>
        </Link>

        <Link
          href="/mandiri/akun"
          className="ml-auto flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="hidden sm:inline">{namaPendek}</span>
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
            {namaPendek.charAt(0).toUpperCase()}
          </span>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
    </div>
  )
}
