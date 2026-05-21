'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generatePayslip } from '@/lib/actions/admin/payslips'

interface Tutor {
  id: string
  full_name: string
  email: string
}

interface MonthOption {
  value: string
  label: string
}

interface Props {
  tutors: Tutor[]
  monthOptions: MonthOption[]
  defaultMonth?: string
  defaultTutorId?: string
}

export default function GeneratePayslipForm({ tutors, monthOptions, defaultMonth, defaultTutorId }: Props) {
  const [month, setMonth] = useState(defaultMonth ?? monthOptions[0]?.value ?? '')
  const [tutorId, setTutorId] = useState(defaultTutorId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tutorId || !month) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await generatePayslip(tutorId, month)
        router.push(`/admin/payslips/${result.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      }
    })
  }

  const [year, mon] = month.split('-').map(Number)
  const payDate = month
    ? new Date(year, mon, 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const workMonthLabel = month
    ? new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : ''

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 space-y-5">
      {/* Month */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bulan Kerja</label>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {month && (
          <p className="text-xs text-gray-400 mt-1">
            Gaji {workMonthLabel} dibayarkan pada <strong>{payDate}</strong>
          </p>
        )}
      </div>

      {/* Tutor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutor</label>
        {tutors.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada tutor terdaftar.</p>
        ) : (
          <select
            value={tutorId}
            onChange={e => setTutorId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">— Pilih tutor —</option>
            {tutors.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        Sistem akan menghitung otomatis semua sesi selesai di bulan yang dipilih, termasuk gaji pokok dan bonus. Jika slip gaji sudah ada, data akan diperbarui.
      </div>

      <button
        type="submit"
        disabled={isPending || !tutorId || !month}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Memproses...' : 'Buat Slip Gaji'}
      </button>
    </form>
  )
}
