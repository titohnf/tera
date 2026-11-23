'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Layar galat untuk permukaan siswa — bahasa yang bisa dipahami anak, dan
 * kode `digest` kecil di bawahnya supaya keluhan lewat WhatsApp bisa dicocokkan
 * dengan baris log. Tab yang dibuka sebelum deploy terbaru masih memegang
 * JavaScript lama (id Server Action berubah tiap build), dan hanya muat ulang
 * penuh yang menolong.
 */
export default function LayarGalat({
  error,
  reset,
  beranda,
}: {
  error: Error & { digest?: string }
  reset: () => void
  /** Tujuan tombol "Ke beranda". */
  beranda: string
}) {
  useEffect(() => {
    console.error('[siswa] render gagal', error)
  }, [error])
  const versiLama = /Server Action .* was not found on the server/.test(error.message ?? '')

  return (
    <div className="rounded-xl bg-white p-6 text-center shadow-kartu">
      <h1 className="text-lg font-semibold text-gray-900">
        {versiLama ? 'Aplikasi baru saja diperbarui' : 'Halaman ini belum bisa dibuka'}
      </h1>
      <p className="mt-1.5 text-sm text-gray-500">
        {versiLama
          ? 'Muat ulang halaman, lalu ulangi langkah terakhir.'
          : 'Jawaban dan datamu aman. Coba lagi sebentar, atau kembali ke beranda.'}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={versiLama ? () => window.location.reload() : reset}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {versiLama ? 'Muat ulang' : 'Coba lagi'}
        </button>
        <Link
          href={beranda}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Ke beranda
        </Link>
      </div>
      {error.digest && <p className="mt-4 font-mono text-[11px] text-gray-300">Kode: {error.digest}</p>}
    </div>
  )
}
