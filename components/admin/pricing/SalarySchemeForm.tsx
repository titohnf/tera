'use client'

import { useActionState, useState } from 'react'
import { upsertSalaryScheme } from '@/lib/actions/admin/pricing'
import type { SalarySchemeRow } from '@/lib/types/database'
import DatePicker from '@/components/ui/DatePicker'

interface SalarySchemeFormProps {
  classId: string
  tutorId: string
  existing: SalarySchemeRow | null
}

export default function SalarySchemeForm({ classId, tutorId, existing }: SalarySchemeFormProps) {
  const action = upsertSalaryScheme.bind(null, classId, tutorId)
  const [state, formAction, pending] = useActionState(action, null)
  const [bonusType, setBonusType] = useState<'none' | 'student_count'>(
    existing?.bonus_type ?? 'none'
  )

  const today = new Date().toISOString().split('T')[0]
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effective_from ?? today)

  return (
    <form action={formAction} className="space-y-5">
      {state && 'error' in state && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}
      {state && 'success' in state && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{state.success}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Gaji Pokok per Sesi (Rp) <span className="text-red-500">*</span>
        </label>
        <input
          name="base_amount"
          type="number"
          required
          min={0}
          step={1000}
          defaultValue={existing?.base_amount ?? 0}
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Bonus</label>
        <select
          name="bonus_type"
          value={bonusType}
          onChange={e => setBonusType(e.target.value as 'none' | 'student_count')}
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">Tidak ada bonus</option>
          <option value="student_count">Bonus berdasarkan jumlah siswa hadir</option>
        </select>
      </div>

      {bonusType === 'student_count' && (
        <div className="pl-4 border-l-2 border-blue-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Minimal Siswa Hadir <span className="text-red-500">*</span>
            </label>
            <input
              name="bonus_threshold"
              type="number"
              required
              min={1}
              defaultValue={existing?.bonus_threshold ?? ''}
              placeholder="Contoh: 5"
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tutor mendapat bonus jika jumlah siswa hadir ≥ angka ini.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nominal Bonus (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              name="bonus_amount"
              type="number"
              required
              min={0}
              step={1000}
              defaultValue={existing?.bonus_amount ?? 0}
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Berlaku Mulai <span className="text-red-500">*</span>
        </label>
        <DatePicker name="effective_from" required value={effectiveFrom} onChange={setEffectiveFrom} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
      >
        {pending ? 'Menyimpan...' : existing ? 'Perbarui Skema Gaji' : 'Buat Skema Gaji'}
      </button>
    </form>
  )
}
