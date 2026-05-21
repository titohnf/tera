'use client'

import { useActionState, useState } from 'react'
import { createUser } from '@/lib/actions/admin/users'

const ROLES = [
  { value: 'student', label: 'Siswa' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'parent', label: 'Orang Tua' },
  { value: 'admin', label: 'Admin' },
]

const JENJANG_OPTIONS = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const

const GRADE_RANGES: Record<string, number[]> = {
  SD: [1, 2, 3, 4, 5, 6],
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
}

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, null)
  const [role, setRole] = useState('student')
  const [level, setLevel] = useState('')
  const [grade, setGrade] = useState<number | null>(null)

  const gradeOptions = GRADE_RANGES[level] ?? null

  function handleLevelChange(val: string) {
    setLevel(val)
    const options = GRADE_RANGES[val]
    if (!options || (grade !== null && !options.includes(grade))) {
      setGrade(null)
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          name="full_name"
          type="text"
          required
          placeholder="Contoh: Budi Santoso"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="contoh@email.com"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password Sementara <span className="text-red-500">*</span>
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Minimal 6 karakter"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Pengguna dapat mengubah password setelah login pertama.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
        <input
          name="phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          name="role"
          required
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {role === 'student' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Orang Tua</label>
            <input
              name="parent_name"
              type="text"
              placeholder="Nama lengkap orang tua / wali"
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenjang</label>
            <div className="flex flex-wrap gap-2">
              {JENJANG_OPTIONS.map(j => (
                <button key={j} type="button" onClick={() => handleLevelChange(j)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    level === j ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                  }`}
                >{j}</button>
              ))}
            </div>
            <input type="hidden" name="level" value={level} />
          </div>

          {gradeOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kelas</label>
              <div className="flex flex-wrap gap-2">
                {gradeOptions.map(g => (
                  <button key={g} type="button" onClick={() => setGrade(grade === g ? null : g)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                      grade === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                    }`}
                  >{g}</button>
                ))}
              </div>
              {grade && <input type="hidden" name="grade" value={grade} />}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Membuat...' : 'Buat Pengguna'}
        </button>
        <a
          href="/admin/users"
          className="px-5 py-2.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </a>
      </div>
    </form>
  )
}
