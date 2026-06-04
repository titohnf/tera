'use client'

import { useActionState, useState, useTransition } from 'react'
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/admin/subjects'

const LEVELS = ['SD', 'SMP', 'SMA', 'Umum']
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Cambridge']

type Subject = { id: string; name: string; level: string[] | null; curriculum: string[] | null; classCount: number }

// ── Selectors ──────────────────────────────────────────────────────────────────

function LevelSelector({ defaultValues }: { defaultValues?: string[] | null }) {
  const [selected, setSelected] = useState<string[]>(defaultValues ?? [])
  const allSelected = selected.length === LEVELS.length

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        type="button"
        onClick={() => setSelected(allSelected ? [] : [...LEVELS])}
        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
          allSelected ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-slate-200 hover:bg-slate-50'
        }`}
      >
        Semua
      </button>
      <div className="w-px h-4 bg-slate-200" />
      {LEVELS.map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setSelected(prev => prev.includes(l) ? prev.filter(v => v !== l) : [...prev, l])}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
            selected.includes(l) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {l}
        </button>
      ))}
      {selected.map(l => <input key={l} type="hidden" name="level" value={l} />)}
    </div>
  )
}

function CurriculumSelector({ defaultValues }: { defaultValues?: string[] | null }) {
  const [selected, setSelected] = useState<string[]>(defaultValues ?? [])

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {CURRICULA.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => setSelected(prev => prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c])}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
            selected.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {c}
        </button>
      ))}
      {selected.map(c => <input key={c} type="hidden" name="curriculum" value={c} />)}
    </div>
  )
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function LevelBadges({ levels }: { levels: string[] | null }) {
  if (!levels || levels.length === 0) return <span className="text-gray-300">—</span>
  return (
    <>
      {levels.map(l => (
        <span key={l} className="inline-flex text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium mr-1">{l}</span>
      ))}
    </>
  )
}

function CurriculumBadges({ curricula }: { curricula: string[] | null }) {
  if (!curricula || curricula.length === 0) return <span className="text-gray-300">—</span>
  return (
    <>
      {curricula.map(c => (
        <span key={c} className="inline-flex text-sm bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium mr-1">{c}</span>
      ))}
    </>
  )
}

// ── Shared Modal Shell ─────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createSubject(null, formData)
      if (result && 'error' in result) setError(result.error)
      else onClose()
    })
  }

  return (
    <Modal title="Tambah Mata Pelajaran" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Nama Mata Pelajaran <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="cth. Matematika"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Kurikulum</p>
          <CurriculumSelector />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Jenjang</p>
          <LevelSelector />
        </div>
        <div className="flex gap-2 pt-4 mt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Menambahkan...' : 'Tambah Mata Pelajaran'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({ subject, onClose, onDelete, deleteDisabled, deleteTitle }: {
  subject: Subject
  onClose: () => void
  onDelete: () => void
  deleteDisabled: boolean
  deleteTitle: string
}) {
  const action = updateSubject.bind(null, subject.id)
  const [state, formAction, pending] = useActionState(action, null)

  if (state && 'success' in state) {
    onClose()
    return null
  }

  return (
    <Modal title="Edit Mata Pelajaran" onClose={onClose}>
      <form action={formAction} className="px-6 py-5 space-y-4">
        {state && 'error' in state && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{state.error}</div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={subject.name}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Kurikulum</p>
          <CurriculumSelector defaultValues={subject.curriculum} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Jenjang</p>
          <LevelSelector defaultValues={subject.level} />
        </div>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {pending ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-lg text-gray-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            title={deleteTitle}
            className="px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Hapus
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SubjectManager({ subjects }: { subjects: Subject[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [filterCurriculum, setFilterCurriculum] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [query, setQuery] = useState('')

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSubject(id)
      if (result && 'error' in result) setDeleteError(result.error)
      else setEditingSubject(null)
    })
  }

  const filtered = subjects.filter(s => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false
    if (filterCurriculum && !s.curriculum?.includes(filterCurriculum)) return false
    if (filterLevel && !s.level?.includes(filterLevel)) return false
    return true
  })

  const hasFilter = !!(query || filterCurriculum || filterLevel)
  const tableTitle = hasFilter
    ? `Menampilkan ${filtered.length} dari ${subjects.length} mata pelajaran`
    : `${subjects.length} Mata Pelajaran`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mata Pelajaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola daftar mata pelajaran yang tersedia untuk kelas.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Mata Pelajaran
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari mata pelajaran..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={filterCurriculum}
          onChange={e => setFilterCurriculum(e.target.value)}
          className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Semua Kurikulum</option>
          {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Semua Jenjang</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        {hasFilter && (
          <button
            onClick={() => { setQuery(''); setFilterCurriculum(''); setFilterLevel('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {editingSubject && (
        <EditModal
          subject={editingSubject}
          onClose={() => { setEditingSubject(null); setDeleteError(null) }}
          onDelete={() => handleDelete(editingSubject.id)}
          deleteDisabled={isPending || editingSubject.classCount > 0}
          deleteTitle={editingSubject.classCount > 0 ? 'Tidak bisa dihapus — masih digunakan kelas' : ''}
        />
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
        </div>

        {deleteError && (
          <div className="mx-5 mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {deleteError}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            {hasFilter ? 'Tidak ada mata pelajaran yang sesuai filter.' : 'Belum ada mata pelajaran.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Kurikulum</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Jenjang</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(subject => (
                  <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                    <td className="pl-5 pr-4 py-3 font-medium text-gray-900">{subject.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <CurriculumBadges curricula={subject.curriculum} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <LevelBadges levels={subject.level} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingSubject(subject)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
