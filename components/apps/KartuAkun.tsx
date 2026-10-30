'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { gantiPassword } from '@/lib/actions/akun'

/**
 * Blok akun: siapa yang sedang login, dan tombol keluar.
 *
 * Sebelum ini keduanya hanya ada di menu avatar pojok kanan atas. Menu itu
 * dilepas karena portal ini sudah punya "Profil" di bilah navigasi bawah — dua
 * pintu ke hal yang sama, dan yang di atas kalah dekat dari ibu jari. Tapi
 * "Keluar" tidak ikut hilang: `signOut()` hanya hidup di satu tempat di seluruh
 * aplikasi, dan menghapus menunya tanpa memindahkan tombolnya berarti orang tua
 * tidak punya cara keluar sama sekali.
 *
 * Nama dan email ikut ditampilkan karena halaman yang memuatnya bicara tentang
 * orang lain — anak, di portal keluarga. Tanpa baris itu, satu-satunya cara
 * memastikan sedang masuk sebagai akun yang mana adalah keluar dan melihat
 * layar login.
 *
 * Dipakai dua portal — keluarga dan pelanggan langganan — jadi ia tinggal di
 * `components/apps` dan propnya menyebut "nama", bukan "nama keluarga".
 */
export default function KartuAkun({
  nama,
  email,
}: {
  nama: string
  email: string
}) {
  const router = useRouter()
  const [keluar, setKeluar] = useState(false)
  const [bukaPassword, setBukaPassword] = useState(false)
  const [hasil, aksiPassword, memproses] = useActionState(gantiPassword, null)

  async function handleKeluar() {
    // Ketukan kedua saat proses pertama masih jalan akan memanggil `signOut()`
    // dua kali dan mendorong dua kali navigasi — di ponsel jedanya cukup
    // panjang untuk sempat terjadi.
    if (keluar) return
    setKeluar(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 divide-y divide-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <span className="shrink-0 w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
          {nama.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">{nama}</span>
          <span className="block text-xs text-gray-400 mt-0.5 truncate">{email}</span>
        </span>
      </div>

      {/* Ganti password: baris yang membuka formulir di tempat, tanpa halaman baru. */}
      <div>
        <button
          type="button"
          onClick={() => setBukaPassword(b => !b)}
          aria-expanded={bukaPassword}
          className="w-full flex items-center gap-3 p-4 text-sm font-medium text-gray-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <span className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </span>
          <span className="flex-1 text-left">Ganti password</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${bukaPassword ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
          </svg>
        </button>

        {bukaPassword && (
          <form action={aksiPassword} className="px-4 pb-4 space-y-2.5">
            <input
              type="password"
              name="lama"
              placeholder="Password lama"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password baru"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="konfirmasi"
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {hasil && 'error' in hasil && (
              <p className="text-xs text-red-600">{hasil.error}</p>
            )}
            {hasil && 'success' in hasil && (
              <p className="text-xs text-emerald-600">{hasil.success}</p>
            )}
            <button
              type="submit"
              disabled={memproses}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition active:bg-blue-700 disabled:opacity-50"
            >
              {memproses ? 'Menyimpan…' : 'Simpan password'}
            </button>
          </form>
        )}
      </div>

      <button
        onClick={handleKeluar}
        disabled={keluar}
        className="w-full flex items-center gap-3 p-4 text-sm font-medium text-red-600 active:bg-red-50 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <span className="shrink-0 w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </span>
        {keluar ? 'Keluar…' : 'Keluar'}
      </button>
    </div>
  )
}
