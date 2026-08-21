'use client'

import { useState, useTransition } from 'react'
import { setStudentIsActive } from '@/lib/actions/admin/users'
import { unenrollStudent } from '@/lib/actions/admin/classes'

export type KelasAktif = { id: string; name: string | null }

/**
 * Tombol status siswa di halaman detail admin — dan satu-satunya jalan untuk
 * mengeluarkan siswa dari kelas.
 *
 * Dulu ada tombol "Keluar" kecil di tiap baris Kelas Aktif. Dua tombol merah
 * yang berdekatan itu tidak pernah menjelaskan bedanya: "Keluar" hanya melepas
 * satu kelas, sedangkan "Nonaktifkan Siswa" melepas SEMUA kelas sekaligus lalu
 * menandai profilnya non-aktif (lihat setStudentIsActive di
 * lib/actions/admin/users.ts). Yang sempit tampil sebagai tombol satu ketukan,
 * yang luas bersembunyi di sidebar — persis terbalik dari risikonya.
 *
 * Sekarang keduanya masuk satu dialog: yang luas jadi bawaan dan dijelaskan
 * dengan angka ("dikeluarkan dari 2 kelas aktif"), yang sempit ditawarkan
 * sebagai pilihan kedua — dan hanya kalau siswanya memang punya lebih dari satu
 * kelas aktif, sebab dengan satu kelas kedua pilihan itu cuma berbeda pada
 * status profilnya, dan itu sudah tertulis di pilihan pertama.
 */
export default function StudentStatusButton({
  userId,
  isActive,
  studentName,
  kelasAktif = [],
}: {
  userId: string
  isActive: boolean
  studentName: string
  /** Kelas yang masih aktif. Menentukan apakah pilihan "satu kelas" muncul. */
  kelasAktif?: KelasAktif[]
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  /** 'semua' = nonaktifkan siswa; selain itu berisi id kelas yang dilepas. */
  const [pilihan, setPilihan] = useState('semua')

  const bolehPilihSatuKelas = kelasAktif.length > 1

  function bukaDialog() {
    setError('')
    setPilihan('semua')
    setShowConfirm(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result =
        pilihan === 'semua'
          ? await setStudentIsActive(userId, !isActive)
          : await unenrollStudent(pilihan, userId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setShowConfirm(false)
    })
  }

  if (isActive) {
    const kelasTerpilih = kelasAktif.find(k => k.id === pilihan)
    return (
      <>
        <button
          onClick={bukaDialog}
          className="w-full px-4 py-2.5 border border-red-200 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          Nonaktifkan Siswa
        </button>
        {error && !showConfirm && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Nonaktifkan {studentName}?
              </h3>

              {bolehPilihSatuKelas ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    {studentName} punya {kelasAktif.length} kelas aktif. Pilih tindakannya:
                  </p>
                  <div className="space-y-2 mb-4">
                    <label
                      className={`flex gap-2.5 items-start rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        pilihan === 'semua'
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tindakan-nonaktif"
                        checked={pilihan === 'semua'}
                        onChange={() => setPilihan('semua')}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-800">
                          Nonaktifkan siswa
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Dikeluarkan dari {kelasAktif.length} kelas aktif sekaligus, dan statusnya
                          jadi non-aktif.
                        </span>
                      </span>
                    </label>

                    <label
                      className={`flex gap-2.5 items-start rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        pilihan !== 'semua'
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tindakan-nonaktif"
                        checked={pilihan !== 'semua'}
                        onChange={() => setPilihan(kelasAktif[0].id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-800">
                          Keluarkan dari satu kelas saja
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Statusnya tetap aktif, kelas lainnya jalan terus.
                        </span>
                        <select
                          value={pilihan === 'semua' ? kelasAktif[0].id : pilihan}
                          onChange={e => setPilihan(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          disabled={pilihan === 'semua'}
                          className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 disabled:opacity-50"
                        >
                          {kelasAktif.map(k => (
                            <option key={k.id} value={k.id}>
                              {k.name ?? 'Kelas'}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  {kelasAktif.length === 1 ? (
                    <>
                      {studentName} akan dikeluarkan dari kelas{' '}
                      <span className="font-medium text-gray-700">
                        {kelasAktif[0].name ?? 'yang sedang diikuti'}
                      </span>{' '}
                      dan statusnya jadi non-aktif.
                    </>
                  ) : (
                    <>Siswa akan ditandai tidak aktif.</>
                  )}{' '}
                  Data dan riwayat sesi tetap tersimpan.
                </p>
              )}

              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

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
                  {isPending
                    ? 'Menyimpan...'
                    : pilihan === 'semua'
                      ? 'Nonaktifkan'
                      : `Keluarkan dari ${kelasTerpilih?.name ?? 'kelas'}`}
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
        onClick={bukaDialog}
        className="w-full px-4 py-2.5 border border-green-200 text-sm font-medium rounded-lg text-green-700 hover:bg-green-50 transition-colors"
      >
        Aktifkan Kembali
      </button>
      {error && !showConfirm && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Aktifkan kembali {studentName}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Siswa akan kembali aktif dan bisa didaftarkan ke kelas. Kelas yang dulu ditinggalkan
              tidak ikut kembali — daftarkan lagi dari halaman kelasnya.
            </p>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
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
