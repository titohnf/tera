import Link from 'next/link'
import Image from 'next/image'
import { keluargaContext } from '@/lib/keluarga'
import HeaderUser from '@/components/layout/HeaderUser'
import { getUser } from '@/lib/supabase/get-user'

export default async function KeluargaLayout({ children }: { children: React.ReactNode }) {
  const { namaKeluarga, anak } = await keluargaContext()
  const user = await getUser()

  // "Profil Saya" di menu avatar menuju profil anak pertama. Portal ini tidak
  // punya halaman profil untuk akun orang tuanya sendiri — yang bisa dilihat
  // dan diubah semuanya milik anaknya — jadi menautkannya ke `/keluarga` cuma
  // memantulkan pengunjung kembali ke beranda yang baru saja mereka tinggalkan.
  const hrefProfil = anak.length > 0 ? `/keluarga/${anak[0].id}/profil` : '/keluarga'

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 sm:px-6">
        {/* Ikonnya saja, teksnya ditulis sendiri. `logo-tera.png` sudah memuat
            tulisan "Bimbel" di atas "Tera" — bertumpuk, dan pada tinggi bilah
            14 (56px) tulisan itu mengecil sampai nyaris tidak terbaca di
            ponsel. `logo-icon.png` adalah lambangnya tanpa teks. */}
        <Link href="/keluarga" className="flex items-center gap-2" aria-label="Beranda Bimbel Tera">
          <Image
            src="/logo-icon.png"
            alt=""
            width={1103}
            height={1086}
            priority
            className="h-7 w-auto"
          />
          <span className="text-base text-gray-900">
            Bimbel <span className="font-semibold">Tera</span>
          </span>
        </Link>
        <HeaderUser
          user={{ email: user?.email ?? '', fullName: namaKeluarga, avatarUrl: null }}
          profileHref={hrefProfil}
          hanyaAvatar
        />
      </header>
      {/* Tanpa `main` di sini: bilah pemilih anak dan bilah navigasi bawah
          menempel ke tepi layar, jadi yang memasang lebar dan padding isi
          adalah `app/keluarga/[studentId]/layout.tsx` — di dalam bilah-bilah
          itu, bukan di luarnya. */}
      {children}
    </div>
  )
}
