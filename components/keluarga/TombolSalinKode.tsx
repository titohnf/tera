'use client'

import { useState } from 'react'

/**
 * Tombol salin kode referal — dipakai banner beranda dan kartu di Profil.
 *
 * Satu-satunya alasan komponen sekecil ini berdiri sendiri: ia butuh `useState`
 * dan clipboard, sementara banner dan kartu yang memuatnya sebaiknya tetap
 * server component. Labelnya berubah jadi "Tersalin" selama dua detik, karena
 * penyalinan yang tidak mengubah apa pun di layar terasa seperti tidak terjadi
 * dan akan diketuk berkali-kali.
 */
export default function TombolSalinKode({
  kode,
  className,
}: {
  kode: string
  className: string
}) {
  const [tersalin, setTersalin] = useState(false)

  async function salin() {
    try {
      await navigator.clipboard.writeText(kode)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    } catch {
      // Clipboard bisa ditolak browser (izin, atau halaman non-HTTPS). Tombol
      // WhatsApp di sebelahnya tetap membawa kodenya, jadi tidak ada jalan yang
      // benar-benar buntu — cuma tidak ada yang tersalin.
    }
  }

  return (
    <button
      onClick={salin}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${className}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 17.25v3a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5h3m2.25-3h7.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z" />
      </svg>
      {tersalin ? 'Tersalin' : 'Salin kode'}
    </button>
  )
}
