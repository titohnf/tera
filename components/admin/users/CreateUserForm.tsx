'use client'

import { useActionState, useState, useRef, useCallback } from 'react'
import { createUser } from '@/lib/actions/admin/users'

const JENJANG_OPTIONS = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const

const GRADE_RANGES: Record<string, number[]> = {
  SD:  [1, 2, 3, 4, 5, 6],
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
}

function generatePassword(name = ''): string {
  const base = name.trim().toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'siswa'
  const digits = String(Math.floor(Math.random() * 900) + 100)
  return base + digits
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{children}</p>
  )
}

export default function CreateUserForm({ initialRole = 'student' }: { initialRole?: string }) {
  const [state, formAction, pending] = useActionState(createUser, null)
  const [role] = useState(initialRole)
  const [level, setLevel] = useState('')
  const [grade, setGrade] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleNameChange(val: string) {
    setName(val)
    setPassword(generatePassword(val))
  }

  const gradeOptions = GRADE_RANGES[level] ?? null

  function handleLevelChange(val: string) {
    setLevel(val)
    const options = GRADE_RANGES[val]
    if (!options || (grade !== null && !options.includes(grade))) setGrade(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [password])

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── Data Diri ───────────────────────────────────────────────── */}
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
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 hover:underline">
            {preview ? 'Ganti foto' : 'Pilih foto'}
          </button>
          <input ref={fileRef} name="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
        </div>

        {/* Nama Lengkap + Panggilan */}
        <div className="flex gap-3">
          <div style={{ flex: '7' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              name="full_name" type="text" required placeholder="Contoh: Budi Santoso"
              value={name} onChange={e => handleNameChange(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div style={{ flex: '3' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Panggilan</label>
            <input
              name="nickname" type="text" placeholder="Contoh: Budi"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* No. Telepon + Tanggal Lahir */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
            <input
              name="phone" type="tel" placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Lahir</label>
            <input
              name="birth_date" type="date"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <input type="hidden" name="role" value={role} />

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

      {role === 'student' && (
        <>
          <div className="space-y-4 border-t border-slate-200 pt-4 -mt-4">
            <SectionLabel>Orang Tua / Wali</SectionLabel>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
                <input
                  name="parent_name" type="text" placeholder="Nama lengkap orang tua / wali"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                <input
                  name="parent_phone" type="tel" placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Akun ────────────────────────────────────────────────────── */}
      <div className="space-y-4 border-t border-slate-200 pt-4 -mt-4">
        <SectionLabel>Akun</SectionLabel>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email" type="email" required placeholder="contoh@email.com"
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              Password Sementara <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="text-xs text-blue-600 hover:underline"
            >
              Buat ulang
            </button>
          </div>
          <div className="relative">
            <input
              name="password"
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleCopy}
              title="Salin password"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Bagikan password ini ke pengguna. Dapat diubah setelah login.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 -mt-4">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Membuat...' : 'Buat Akun'}
        </button>
        <a
          href={role === 'student' ? '/admin/siswa' : role === 'tutor' ? '/admin/tutor' : '/admin/users'}
          className="px-5 py-2.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </a>
      </div>
    </form>
  )
}
