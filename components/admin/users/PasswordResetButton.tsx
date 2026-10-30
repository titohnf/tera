'use client'

import { useState, useTransition } from 'react'
import { resetPasswordKeDefault } from '@/lib/actions/admin/users'

/**
 * Tombol admin: kembalikan password akun ke password default awal.
 * Dua ketukan (tombol, lalu konfirmasi) karena tindakannya langsung mengganti
 * password pemilik akun.
 */
export default function PasswordResetButton({ userId }: { userId: string }) {
  const [langkah, setLangkah] = useState<'diam' | 'konfirmasi' | 'selesai'>('diam')
  const [galat, setGalat] = useState('')
  const [memproses, mulai] = useTransition()

  function reset() {
    mulai(async () => {
      const hasil = await resetPasswordKeDefault(userId)
      if (hasil?.error) {
        setGalat(hasil.error)
        setLangkah('diam')
      } else {
        setGalat('')
        setLangkah('selesai')
      }
    })
  }

  if (langkah === 'konfirmasi') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm text-amber-900">
          Password akun ini akan dikembalikan ke password default awal. Lanjutkan?
        </p>
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={reset}
            disabled={memproses}
            className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {memproses ? 'Mereset...' : 'Ya, reset'}
          </button>
          <button
            onClick={() => setLangkah('diam')}
            disabled={memproses}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => {
          setGalat('')
          setLangkah('konfirmasi')
        }}
        className="w-full px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Reset Password ke Default
      </button>
      {langkah === 'selesai' && (
        <p className="text-xs text-green-600 mt-1.5">
          Password dikembalikan ke default awal. Beri tahu pemilik akun untuk masuk dengan password itu, lalu menggantinya.
        </p>
      )}
      {galat && <p className="text-xs text-red-600 mt-1.5">{galat}</p>}
    </div>
  )
}
