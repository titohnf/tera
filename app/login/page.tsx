'use client'

import Image from 'next/image'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { tautanWaAdmin } from '@/lib/kontak'
import { masukDenganKode } from '@/lib/actions/umum'

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

function FormLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Dua pintu: siswa bimbel (akun) dan umum (kode). Tab awal dan pesan galat
  // kode datang dari alamat (?tab=umum&galat=1), jadi redirect dari tindakan
  // masuk dengan kode kembali ke tab yang benar.
  const params = useSearchParams()
  const [tab, setTab] = useState<'bimbel' | 'umum'>(params.get('tab') === 'umum' ? 'umum' : 'bimbel')
  const galatKode = params.get('galat') === '1'
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
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'bimbel' ? 'Masuk ke akun kamu' : 'Masuk dengan kode peserta'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium" role="tablist">
          {([
            ['bimbel', 'Siswa Bimbel'],
            ['umum', 'Umum'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-md px-3 py-2 transition-colors ${tab === k ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'umum' ? (
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
            {galatKode && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Kode tidak dikenal. Periksa lagi kodenya, atau tanya tutor.</p>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Masuk
            </button>
          </form>
        ) : (
        <>
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
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
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
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <FormLogin />
    </Suspense>
  )
}
