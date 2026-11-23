import Link from 'next/link'
import BilahAtas from '@/components/ui/BilahAtas'
import BilahBawah from '@/components/ui/BilahBawah'
import Image from 'next/image'
import { umumContext } from '@/lib/umum'

/** Rangka beranda peserta umum (masuk dengan kode). Sejajar dengan `/mandiri`. */
export default async function UmumLayout({ children }: { children: React.ReactNode }) {
  await umumContext()
  return (
    <div className="tampilan-siswa min-h-screen bg-slate-100">
      <BilahAtas
        dasar={'/umum'}
        akar={{ profil: 'Profil' }}
        beranda={
          <header className="flex h-14 items-center border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
            <Link href={'/umum'} className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
              <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
              <span className="text-base text-gray-900">
                Bimbel <span className="font-semibold">Tera</span>
              </span>
            </Link>
          </header>
        }
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-28">{children}</main>
      <BilahBawah dasar={'/umum'} profil={'/umum/profil'} />
    </div>
  )
}
