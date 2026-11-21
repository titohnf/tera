import Image from 'next/image'
import Link from 'next/link'
import { masukDenganKode } from '@/lib/actions/umum'

export const metadata = { title: 'Masuk dengan kode' }

/**
 * Masuk dengan kode peserta, tanpa akun. Untuk murid dari luar bimbel yang
 * mengikuti try out. Kodenya dikirim tutor lewat WhatsApp.
 */
export default async function MasukKodePage({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/80 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="Bimbel Tera" width={32} height={32} />
            <h1 className="text-2xl font-bold text-gray-900">Bimbel Tera</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Masuk dengan kode peserta</p>
        </div>

        <form action={masukDenganKode} className="space-y-4">
          <div>
            <label htmlFor="kode" className="block text-sm font-medium text-gray-700 mb-1">Kode peserta</label>
            <input
              id="kode"
              name="kode"
              required
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Contoh: Q6G484"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Kode dikirim tutor lewat WhatsApp.</p>
          </div>
          {galat && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Kode tidak dikenal. Periksa lagi kodenya, atau tanya tutor.</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Masuk
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Masuk dengan email
          </Link>
        </p>
      </div>
    </div>
  )
}
