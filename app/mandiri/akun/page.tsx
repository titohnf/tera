import Link from 'next/link'
import { mandiriContext } from '@/lib/mandiri'
import KartuAkun from '@/components/apps/KartuAkun'

/**
 * Akun pelanggan: siapa yang sedang login, status langganan, dan tombol keluar.
 *
 * `KartuAkun` adalah komponen yang sama dengan yang dipakai portal keluarga —
 * dan itu penting bukan karena hemat, tapi karena `signOut()` hanya boleh hidup
 * di satu tempat. Salinan kedua adalah tempat tombol keluar pelan-pelan
 * berhenti bekerja tanpa ada yang menyadarinya.
 */
export default async function AkunMandiri() {
  const { user, nama, produk } = await mandiriContext()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-gray-900">Akun</h1>

      <Link
        href="/mandiri/langganan"
        className="flex items-center gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5 active:bg-slate-50 hover:ring-blue-300 transition"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">Langganan</span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {produk.sora ? 'SORA aktif' : 'SORA belum aktif'}
          </span>
        </span>
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      <KartuAkun nama={nama} email={user.email ?? ''} />
    </div>
  )
}
