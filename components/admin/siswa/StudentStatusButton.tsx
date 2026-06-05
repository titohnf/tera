'use client'

import { useState, useTransition } from 'react'
import { setStudentIsActive } from '@/lib/actions/admin/users'

export default function StudentStatusButton({
  userId,
  isActive,
  studentName,
}: {
  userId: string
  isActive: boolean
  studentName: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await setStudentIsActive(userId, !isActive)
      if (result?.error) {
        setError(result.error)
      }
      setShowConfirm(false)
    })
  }

  if (isActive) {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full px-4 py-2.5 border border-red-200 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          Nonaktifkan Siswa
        </button>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Nonaktifkan {studentName}?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Siswa akan ditandai tidak aktif. Data dan riwayat sesi tetap tersimpan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-sm font-medium rounded-lg text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'Menyimpan...' : 'Nonaktifkan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full px-4 py-2.5 border border-green-200 text-sm font-medium rounded-lg text-green-700 hover:bg-green-50 transition-colors"
      >
        Aktifkan Kembali
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Aktifkan kembali {studentName}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Siswa akan kembali aktif dan bisa didaftarkan ke kelas.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-sm font-medium rounded-lg text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Menyimpan...' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
