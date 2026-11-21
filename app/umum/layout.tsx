import Link from 'next/link'
import Image from 'next/image'
import { umumContext } from '@/lib/umum'
import { keluarUmum } from '@/lib/actions/umum'

/** Rangka beranda peserta umum (masuk dengan kode). Sejajar dengan `/mandiri`. */
export default async function UmumLayout({ children }: { children: React.ReactNode }) {
  const { namaPendek } = await umumContext()
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 sm:px-6">
        <Link href="/umum" className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
          <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
          <span className="text-base text-gray-900">
            Bimbel <span className="font-semibold">Tera</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-600">
          <span className="hidden sm:inline">{namaPendek}</span>
          <form action={keluarUmum}>
            <button type="submit" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-slate-50">
              Keluar
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
    </div>
  )
}
