import Link from 'next/link'
import Image from 'next/image'
import TombolKeluar from '@/components/siswa/TombolKeluar'
import { anakOrRedirect } from '@/lib/keluarga'

/**
 * Rangka beranda siswa bimbel yang masuk dengan KODE. Tampilannya sengaja sama dengan rangka
 * pelanggan langganan (`app/mandiri/layout.tsx`): tanpa bilah navigasi bawah, tanpa Tagihan dan
 * Laporan; hanya kartu-kartunya. Yang membedakan: kartunya membuka permukaan belajar atas nama
 * anak (`?anak=`) karena sesinya akun keluarga, dan ada tombol Keluar di pojok.
 * Penjaganya `anakOrRedirect`: hanya anak dari keluarga yang sedang login.
 */
export default async function SiswaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 sm:px-6">
        <Link href={`/siswa/${studentId}`} className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
          <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
          <span className="text-base text-gray-900">
            Bimbel <span className="font-semibold">Tera</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">{anak.nama_pendek}</span>
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
            {anak.nama_pendek.charAt(0).toUpperCase()}
          </span>
          <TombolKeluar />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">{children}</main>
    </div>
  )
}
