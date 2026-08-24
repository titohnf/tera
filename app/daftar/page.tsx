'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Pendaftaran mandiri untuk pelanggan SORA/GAMA di luar bimbel.
 *
 * Bentuknya meniru `app/login/page.tsx`. Satu hal yang TIDAK ditirunya:
 * halaman ini tidak mengirim `role` di metadata pendaftaran. Sejak migrasi 108
 * trigger `handle_new_user` memang tidak lagi membacanya — nilai apa pun di
 * sana akan diabaikan — dan mengirimkannya tetap akan menyesatkan pembaca
 * berikutnya, seolah peran ditentukan dari sini.
 *
 * Akun keluarga bimbel TIDAK dibuat lewat halaman ini. Ia tetap dibuat admin,
 * karena sebuah akun keluarga tidak ada artinya sampai ia ditautkan ke anak-
 * anaknya lewat `family_students`, dan tautan itu keputusan bimbel.
 *
 * Sesudah pendaftaran, akun harus mengonfirmasi emailnya dulu — layar ini
 * berhenti di kalimat itu alih-alih mengarahkan ke mana-mana, karena sesinya
 * memang belum ada.
 */
export default function DaftarPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [terkirim, setTerkirim] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nama.trim() },
        emailRedirectTo: `${window.location.origin}/auth/konfirmasi`,
      },
    })

    if (error) setError(error.message)
    else setTerkirim(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/80 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="Bimbel Tera" width={32} height={32} />
            <h1 className="text-2xl font-bold text-gray-900">Bimbel Tera</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Buat akun untuk berlatih soal</p>
        </div>

        {terkirim ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Tautan konfirmasi sudah dikirim ke <span className="font-medium">{email}</span>.
              Buka tautannya untuk menyelesaikan pendaftaran.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tidak menemukan emailnya? Cek folder spam — kadang ia mendarat di sana.
            </p>
            <Link href="/login" className="block text-sm font-medium text-blue-600">
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <p className="text-xs text-gray-400 mt-1">Minimal 8 karakter.</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Mendaftar…' : 'Daftar'}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-blue-600">
                Masuk
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
              Orang tua murid bimbel tidak perlu mendaftar di sini — akunnya dibuatkan admin.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
