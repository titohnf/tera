'use client'

import { useActionState, useState, useRef } from 'react'
import { updateUser } from '@/lib/actions/admin/users'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{children}</p>
  )
}

type DefaultValues = {
  full_name: string
  phone: string | null
  role: string
  level: string | null
  grade: number | null
  parent_name: string | null
  nickname: string | null
  birth_date: string | null
  parent_phone: string | null
  avatar_url: string | null
}

interface EditUserFormProps {
  userId: string
  defaultValues: DefaultValues
  hideRole?: boolean
}

export default function EditUserForm({ userId, defaultValues, hideRole }: EditUserFormProps) {
  const updateUserWithId = updateUser.bind(null, userId)
  const [state, formAction, pending] = useActionState(updateUserWithId, null)
  const [role, setRole] = useState(defaultValues.role)
  const [level, setLevel] = useState(defaultValues.level ?? '')
  const [grade, setGrade] = useState<number | null>(defaultValues.grade ?? null)
  const [preview, setPreview] = useState<string | null>(defaultValues.avatar_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const gradeOptions = GRADE_RANGES[level] ?? null

  function handleLevelChange(val: string) {
    setLevel(val)
    const options = GRADE_RANGES[val]
    if (!options || (grade !== null && !options.includes(grade))) {
      setGrade(null)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── Data Diri ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Data Diri</SectionLabel>

        {/* Foto */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-opacity ring-2 ring-white shadow-md"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {getInitials(defaultValues.full_name)}
              </span>
            )}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 hover:underline">
            {preview ? 'Ganti foto' : 'Pilih foto'}
          </button>
          <input ref={fileRef} name="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
        </div>

        {/* Nama Lengkap + Nama Panggilan */}
        <div className="flex gap-3">
          <div style={{ flex: '7' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name"
              type="text"
              required
              defaultValue={defaultValues.full_name}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div style={{ flex: '3' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Panggilan</label>
            <input
              name="nickname"
              type="text"
              defaultValue={defaultValues.nickname ?? ''}
              placeholder="Contoh: Budi"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* No. Telepon + Tanggal Lahir */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
            <input
              name="phone"
              type="tel"
              defaultValue={defaultValues.phone ?? ''}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Lahir</label>
            <input
              name="birth_date"
              type="date"
              defaultValue={defaultValues.birth_date ?? ''}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {!hideRole && (
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
        )}
        {hideRole && <input type="hidden" name="role" value={defaultValues.role} />}

        {role === 'student' && (
          <>
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
      </div>

      {/* ── Orang Tua / Wali ─────────────────────────────────────────── */}
      {role === 'student' && (
        <div className="space-y-4 border-t border-slate-200 pt-4 -mt-4">
          <SectionLabel>Orang Tua / Wali</SectionLabel>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
              <input
                name="parent_name"
                type="text"
                defaultValue={defaultValues.parent_name ?? ''}
                placeholder="Nama lengkap orang tua / wali"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
              <input
                name="parent_phone"
                type="tel"
                defaultValue={defaultValues.parent_phone ?? ''}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 -mt-4">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
