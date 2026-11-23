import Link from 'next/link'
import BilahAtas from '@/components/ui/BilahAtas'
import BilahBawah from '@/components/ui/BilahBawah'
import Image from 'next/image'
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
  await anakOrRedirect(studentId)

  return (
    <div className="tampilan-siswa min-h-screen bg-slate-100">
      <BilahAtas
        dasar={`/siswa/${studentId}`}
        akar={{ profil: 'Profil' }}
        beranda={
          <header className="h-14 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
            <div className="mx-auto flex h-full w-full max-w-xl items-center">
            <Link href={`/siswa/${studentId}`} className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
              <Image src="/logo-icon.png" alt="" width={1103} height={1086} priority className="h-7 w-auto" />
              <span className="text-base text-gray-900">
                Bimbel <span className="font-semibold">Tera</span>
              </span>
            </Link>
            </div>
          </header>
        }
      />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-28">{children}</main>
      <BilahBawah dasar={`/siswa/${studentId}`} profil={`/siswa/${studentId}/profil`} />
    </div>
  )
}
