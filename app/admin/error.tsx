'use client'

/**
 * Penangkap error untuk seluruh halaman admin.
 *
 * Tanpa file ini, satu baris yang gagal dirender membuat Next menampilkan layar
 * bawaannya: "This page couldn't load", tanpa satu pun petunjuk soal apa yang
 * rusak. Halaman Kalender Libur pernah mati begitu selama berhari-hari — sebabnya
 * baru ketahuan setelah membuka console browser.
 *
 * Yang ditampilkan di sini sengaja cukup untuk dilaporkan lewat WhatsApp: nama
 * halamannya, pesan errornya, dan `digest` — kode yang dipakai Next untuk
 * menyamarkan error server di produksi, dan satu-satunya cara mencocokkan
 * keluhan admin dengan baris log di Vercel.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()

  // Tab yang dibuka sebelum deploy terbaru masih memegang JavaScript lama, dan
  // id Server Action berubah di setiap build. Aksi apa pun dari tab itu ditolak
  // server dengan pesan ini. `reset()` tidak menolong karena merender ulang
  // dengan JavaScript lama yang sama; yang menolong cuma muat ulang penuh.
  const versiLama = /Server Action .* was not found on the server/.test(error.message ?? '')

  // Di produksi console browser adalah satu-satunya tempat stack trace aslinya
  // masih utuh; yang tampil di layar sudah dipotong Next.
  useEffect(() => {
    console.error('[admin] render gagal di', pathname, error)
  }, [error, pathname])

  if (versiLama) {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8">
        <h1 className="text-lg font-semibold text-gray-900">Aplikasi baru saja diperbarui</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Halaman ini dibuka sebelum versi terbaru terpasang, jadi perubahan tadi belum
          tersimpan. Muat ulang halaman, lalu ulangi langkah terakhir.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Muat Ulang Halaman
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8">
      <h1 className="text-lg font-semibold text-gray-900">Halaman ini gagal dimuat</h1>
      <p className="text-sm text-gray-500 mt-1.5">
        Datanya aman — yang gagal cuma menampilkannya. Coba muat ulang; kalau masih
        sama, kirimkan keterangan di bawah ini supaya bisa ditelusuri.
      </p>

      <dl className="mt-5 bg-gray-50 rounded-lg p-4 text-sm space-y-2">
        <div className="flex gap-3">
          <dt className="text-gray-500 w-20 shrink-0">Halaman</dt>
          <dd className="text-gray-800 font-mono text-xs break-all">{pathname}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="text-gray-500 w-20 shrink-0">Pesan</dt>
          <dd className="text-gray-800 font-mono text-xs break-all">{error.message || '—'}</dd>
        </div>
        {error.digest && (
          <div className="flex gap-3">
            <dt className="text-gray-500 w-20 shrink-0">Kode</dt>
            <dd className="text-gray-800 font-mono text-xs break-all">{error.digest}</dd>
          </div>
        )}
      </dl>

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Muat Ulang
        </button>
        <a
          href="/admin"
          className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50"
        >
          Kembali ke Dasbor
        </a>
      </div>
    </div>
  )
}
