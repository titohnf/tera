import RemahRoti from '@/components/siswa/RemahRoti'
import { redirect } from 'next/navigation'
import { umumContext } from '@/lib/umum'
import { buatAkunDariKode } from '@/lib/actions/umum'

export const metadata = { title: 'Amankan akunmu' }

const PESAN: Record<string, string> = {
  email: 'Alamat email tidak valid.',
  pendek: 'Password minimal 8 karakter.',
  beda: 'Password dan ulangannya tidak sama.',
  sudah: 'Peserta ini sudah punya akun. Masuk dengan email di halaman login.',
  terpakai: 'Email ini sudah dipakai akun lain. Pakai email yang berbeda.',
  gagal: 'Akun belum bisa dibuat. Coba lagi, atau hubungi admin.',
}

/**
 * Menambahkan email dan password pada peserta umum. Riwayat try out tetap
 * tersimpan karena orangnya sama; kodenya juga tetap bisa dipakai.
 */
export default async function AkunUmumPage({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { nama, punyaAkun } = await umumContext()
  if (punyaAkun) redirect('/umum')
  const { galat } = await searchParams
  return (
    <div className="space-y-5">
      <RemahRoti item={[{ label: 'Beranda', href: '/umum' }, { label: 'Akun' }]} />
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Amankan akunmu</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Tambahkan email dan password untuk {nama}. Seluruh riwayat try out ikut tersimpan, dan akun ini yang dipakai bila nanti berlangganan.
        </p>
      </div>
      <form action={buatAkunDariKode} className="max-w-md space-y-4 rounded-xl bg-white p-5 shadow ring-1 ring-gray-900/5">
        <label className="block text-sm font-medium text-gray-700">
          Email
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Password (minimal 8 karakter)
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Ulangi password
          <input name="ulang" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
        {galat && PESAN[galat] && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{PESAN[galat]}</p>}
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          Buat akun
        </button>
        <p className="text-xs text-gray-500">Lupa password nanti? Hubungi admin; password direset dari panel admin.</p>
      </form>
    </div>
  )
}
