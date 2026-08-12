'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteStudent,
  getStudentDeletionImpact,
  type StudentDeletionImpact,
} from '@/lib/actions/admin/users'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

/** Baris dampak yang nilainya nol tidak ditampilkan supaya yang penting menonjol. */
function impactLines(impact: StudentDeletionImpact): string[] {
  const lines: string[] = []
  if (impact.enrollments > 0) lines.push(`${impact.enrollments} keanggotaan kelas`)
  if (impact.attendances > 0) lines.push(`${impact.attendances} catatan kehadiran`)
  if (impact.assessmentResults > 0) lines.push(`${impact.assessmentResults} nilai asesmen`)
  if (impact.performanceNotes > 0) lines.push(`${impact.performanceNotes} catatan performa`)
  if (impact.reportNotes > 0) lines.push(`${impact.reportNotes} catatan laporan bulanan`)
  if (impact.practiceRecords > 0) lines.push('riwayat latihan mandiri')
  if (impact.familyLinks > 0) lines.push(`${impact.familyLinks} tautan ke akun keluarga`)
  return lines
}

export default function DeleteStudentButton({
  userId,
  studentName,
}: {
  userId: string
  studentName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [impact, setImpact] = useState<StudentDeletionImpact | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setError('')
    setConfirmName('')
    setImpact(null)
    setOpen(true)
    startTransition(async () => {
      const res = await getStudentDeletionImpact(userId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setImpact(res)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteStudent(userId, confirmName)
      if (res?.error) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.push('/admin/siswa')
      router.refresh()
    })
  }

  const nameMatches = confirmName.trim().toLowerCase() === studentName.trim().toLowerCase()
  const lines = impact ? impactLines(impact) : []

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full px-4 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      >
        Hapus Siswa Permanen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Hapus {studentName} secara permanen?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tindakan ini tidak bisa dibatalkan. Kalau siswa ini hanya berhenti belajar,
              pakai <span className="font-medium text-gray-700">Nonaktifkan Siswa</span> — riwayatnya tetap tersimpan.
            </p>

            {!impact && !error && (
              <p className="text-sm text-gray-400 mb-4">Menghitung data yang ikut terhapus...</p>
            )}

            {impact && (
              <div className="mb-4 space-y-3">
                {lines.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Ikut terhapus:</p>
                    <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside">
                      {lines.map(l => <li key={l}>{l}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Siswa ini belum punya data apa pun selain profilnya.
                  </p>
                )}

                {impact.invoices > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Data keuangan ikut terhapus</p>
                    <p className="text-sm text-red-600">
                      {impact.invoices} invoice
                      {impact.paymentCount > 0 && (
                        <> beserta {impact.paymentCount} pembayaran senilai {formatRupiah(impact.paymentTotal)}</>
                      )}.
                    </p>
                    {impact.paymentCount > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Angka di halaman Laba Rugi untuk bulan pembayaran tersebut akan ikut berubah.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Ketik <span className="font-semibold text-gray-800">{studentName}</span> untuk mengonfirmasi
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={studentName}
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending || !nameMatches || !impact}
                className="flex-1 px-4 py-2 bg-red-600 text-sm font-medium rounded-lg text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
