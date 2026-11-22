'use client'

import Image from 'next/image'
import { Suspense, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { tautanWaAdmin } from '@/lib/kontak'
import { masukDenganKode } from '@/lib/actions/umum'
import type { Tampilan } from '@/lib/tampilan'

/**
 * Tujuan yang aman untuk dituju setelah masuk.
 *
 * Hanya jalur relatif di dalam Tera yang diterima. Tanpa penyaringan ini,
 * `?next=https://situs-lain/...` membuat halaman login kita jadi batu loncatan
 * yang meyakinkan untuk memancing orang — mereka melihat domain Tera, masuk,
 * lalu dilempar ke tempat lain. `//` ikut ditolak karena browser membacanya
 * sebagai alamat berdomain lain.
 */
function tujuanAman(next: string | null): string {
  if (!next) return '/'
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

/** Tombol kirim form-aksi: menyala dengan putaran dan tulisan "Memproses..." selama aksi server berjalan. */
function TombolMasukKode() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-400"
    >
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
      {pending ? 'Memproses...' : 'Masuk'}
    </button>
  )
}

function FormLogin({ tampilan, hrefLawan }: { tampilan: Tampilan; hrefLawan: string | null }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Dua cara masuk, untuk siapa pun (siswa bimbel, pelanggan, peserta umum): email dan password,
  // atau kode peserta. Tab awal dan pesan galat kode datang dari alamat (?tab=kode&galat=1), jadi
  // redirect dari tindakan masuk dengan kode kembali ke tab yang benar. `?tab=umum` (tautan lama)
  // tetap dibaca sebagai tab kode.
  const params = useSearchParams()
  // Satu cara masuk per alamat: sora = kode, app = email (lihat lib/tampilan.ts).
  const tab: 'email' | 'kode' = tampilan === 'sora' ? 'kode' : 'email'
  const galatKode = params.get('galat') === '1'
  const terlaluSering = params.get('galat') === '2'
  const akunBaru = params.get('info') === 'akun'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      // `/` menyortir tujuan menurut peran; `next` dipakai kalau pengguna
      // datang dari tautan berkas atau halaman tertentu dan harus kembali ke
      // sana, bukan ke berandanya.
      const next = new URLSearchParams(window.location.search).get('next')
      window.location.href = tujuanAman(next)
      return // tombol tetap "Memproses..." sampai halaman berpindah
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/80 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="Bimbel Tera" width={32} height={32} />
            <h1 className="text-2xl font-bold text-gray-900">Bimbel Tera</h1>
          </div>
          {tab === 'email' && <p className="text-sm text-gray-500 mt-1">Masuk dengan email dan password</p>}
        </div>

        {tab === 'kode' ? (
          <form action={masukDenganKode} className="space-y-4">
            <div>
              <label htmlFor="kode" className="block text-sm font-medium text-gray-700 mb-1">Kode siswa</label>
              <input
                id="kode"
                name="kode"
                required
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="6 huruf dan angka"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {terlaluSering && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.</p>
            )}
            {galatKode && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Kode tidak dikenal. Periksa lagi kodenya, atau tanya tutor.</p>
            )}
            <TombolMasukKode />
            <p className="text-center text-sm text-gray-500">
              Lupa kode?{' '}
              <a
                href={tautanWaAdmin('Halo admin Bimbel Tera, saya lupa kode siswa saya.')}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Hubungi admin
              </a>
            </p>
          </form>
        ) : (
        <>
        {akunBaru && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Akun dibuat. Masuk dengan email dan password barumu.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@kamu.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-blue-400"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Tidak ada reset password mandiri: siapa pun yang tahu sebuah email bisa
            mengembalikan password pemiliknya. Yang lupa menghubungi admin, yang
            mereset dari panel admin. Emailnya ikut terisi di pesan bila sudah diketik. */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Lupa password?{' '}
          <a
            href={tautanWaAdmin(
              email.trim()
                ? `Halo admin Bimbel Tera, saya lupa password akun saya. Email saya: ${email.trim()}`
                : 'Halo admin Bimbel Tera, saya lupa password akun saya.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Hubungi admin
          </a>
        </p>
        </>
        )}
        {hrefLawan && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-sm text-gray-500">
              {tampilan === 'sora' ? 'Orang tua atau wali?' : 'Siswa?'}
            </p>
            <a
              href={hrefLawan}
              className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              {tampilan === 'sora' ? 'Masuk dengan email' : 'Masuk dengan kode'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FormLoginHalaman({ tampilan, hrefLawan }: { tampilan: Tampilan; hrefLawan: string | null }) {
  return (
    <Suspense fallback={null}>
      <FormLogin tampilan={tampilan} hrefLawan={hrefLawan} />
    </Suspense>
  )
}
