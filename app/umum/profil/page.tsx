import Link from 'next/link'
import { umumContext } from '@/lib/umum'
import TombolKeluar from '@/components/siswa/TombolKeluar'

export const metadata = { title: 'Profil' }

/** Tab Profil peserta umum (masuk dengan kode): nama, kode peserta, ajakan mengamankan akun, dan Keluar. */
export default async function ProfilUmumPage() {
  const { nama, namaPendek, kode, punyaAkun } = await umumContext()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tera text-xl font-extrabold text-white">
          {namaPendek.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-extrabold text-slate-900">{nama}</span>
          <span className="block text-sm font-medium text-slate-500">Kode peserta {kode}</span>
        </span>
      </div>
      {!punyaAkun && (
        <Link
          href="/umum/akun"
          className="block rounded-xl bg-white p-4 shadow-kartu transition hover:bg-slate-50"
        >
          <span className="block text-sm font-semibold text-gray-900">Amankan akunmu</span>
          <span className="block text-sm font-medium text-slate-500">Tambahkan email dan password agar riwayat try out tetap tersimpan.</span>
        </Link>
      )}
      <TombolKeluar className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-kartu transition hover:bg-red-50 disabled:opacity-60" />
    </div>
  )
}
