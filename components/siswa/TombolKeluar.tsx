'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { keluarUmum } from '@/lib/actions/umum'

/** Keluar dari akun, lalu ke halaman login. Dipakai beranda siswa yang masuk dengan kode. */
export default function TombolKeluar() {
  const [keluar, setKeluar] = useState(false)
  async function handleKeluar() {
    if (keluar) return
    setKeluar(true)
    await createClient().auth.signOut()
    // Cookie kode (httpOnly) hanya bisa dihapus dari server; ia juga yang mengarahkan ke layar masuk.
    await keluarUmum()
  }
  return (
    <button
      type="button"
      onClick={handleKeluar}
      disabled={keluar}
      className="ml-3 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
    >
      {keluar ? 'Keluar…' : 'Keluar'}
    </button>
  )
}
