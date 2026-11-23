import Link from 'next/link'
import BilahAtas from '@/components/ui/BilahAtas'
import BilahBawah from '@/components/ui/BilahBawah'
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
 * Bilah navigasi bawah baru berisi Beranda dan Profil (`BilahBawah`); pintu ke
 * Misi, Materi, dan Try Out tetap kartu di beranda.
 */
export default async function MandiriLayout({ children }: { children: React.ReactNode }) {
  await mandiriContext()

  return (
    <div className="min-h-screen bg-slate-100">
      <BilahAtas
        dasar={'/mandiri'}
        akar={{ akun: 'Profil' }}
        beranda={
          <header className="flex h-14 items-center border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
            <Link href={'/mandiri'} className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
              <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
              <span className="text-base text-gray-900">
                Bimbel <span className="font-semibold">Tera</span>
              </span>
            </Link>
          </header>
        }
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-28">{children}</main>
      <BilahBawah dasar={'/mandiri'} profil={'/mandiri/akun'} />
    </div>
  )
}
