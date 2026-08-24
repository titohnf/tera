'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
