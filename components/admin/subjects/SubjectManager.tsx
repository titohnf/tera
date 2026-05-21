'use client'

import { useActionState, useState, useTransition } from 'react'
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/admin/subjects'

const LEVELS = ['SD', 'SMP', 'SMA', 'Umum']
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Cambridge']

type Subject = { id: string; name: string; level: string[] | null; curriculum: string[] | null; classCount: number }

function LevelSelector({ defaultValues }: { defaultValues?: string[] | null }) {
  const [selected, setSelected] = useState<string[]>(defaultValues ?? [])
  const allSelected = selected.length === LEVELS.length

  function toggle(val: string) {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function toggleAll() {
    setSelected(allSelected ? [] : [...LEVELS])
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        type="button"
        onClick={toggleAll}
        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
          allSelected
            ? 'bg-gray-700 text-white border-gray-700'
            : 'bg-white text-gray-500 border-slate-300 hover:bg-blue-50/50'
        }`}
      >
        Semua
      </button>
      <div className="w-px h-4 bg-gray-200" />
      {LEVELS.map(l => (
        <button
          key={l}
          type="button"
          onClick={() => toggle(l)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(l)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
          }`}
        >
          {l}
        </button>
      ))}
      {selected.map(l => (
        <input key={l} type="hidden" name="level" value={l} />
      ))}
    </div>
  )
}

function CurriculumSelector({ defaultValues }: { defaultValues?: string[] | null }) {
  const [selected, setSelected] = useState<string[]>(defaultValues ?? [])

  function toggle(val: string) {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {CURRICULA.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => toggle(c)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(c)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-slate-300 hover:bg-indigo-50/50'
          }`}
        >
          {c}
        </button>
      ))}
      {selected.map(c => (
        <input key={c} type="hidden" name="curriculum" value={c} />
      ))}
    </div>
  )
}

function LevelBadges({ levels }: { levels: string[] | null }) {
  if (!levels || levels.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap mt-0.5">
      {levels.map(l => (
        <span key={l} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{l}</span>
      ))}
    </div>
  )
}

function CurriculumBadges({ curricula }: { curricula: string[] | null }) {
  if (!curricula || curricula.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap mt-0.5">
      {curricula.map(c => (
        <span key={c} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">{c}</span>
      ))}
    </div>
  )
}

export default function SubjectManager({ subjects }: { subjects: Subject[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createState, createAction, createPending] = useActionState(createSubject, null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSubject(id)
      if (result && 'error' in result) setDeleteError(result.error)
    })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tambah Mata Pelajaran</h2>
        <form action={createAction} className="space-y-3">
          {createState && 'error' in createState && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createState.error}</div>
          )}
          {createState && 'success' in createState && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{createState.success}</div>
          )}
          <input
            name="name"
            type="text"
            required
            placeholder="Nama mata pelajaran *"
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">Kurikulum</p>
            <CurriculumSelector />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Jenjang</p>
            <LevelSelector />
          </div>
          <button
            type="submit"
            disabled={createPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {createPending ? 'Menambahkan...' : 'Tambah'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-300 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daftar Mata Pelajaran ({subjects.length})</p>
        </div>

        {deleteError && (
          <div className="px-5 py-3 bg-red-50 border-b text-sm text-red-700">{deleteError}</div>
        )}

        {subjects.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">Belum ada mata pelajaran.</div>
        ) : (
          <div className="divide-y divide-slate-300">
            {subjects.map(subject => {
              const isOpen = editingId === subject.id
              return (
                <div key={subject.id}>
                  <button
                    type="button"
                    onClick={() => setEditingId(isOpen ? null : subject.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                      <CurriculumBadges curricula={subject.curriculum} />
                      <LevelBadges levels={subject.level} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">{subject.classCount} kelas</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200">
                      <EditRow
                        subject={subject}
                        onDone={() => setEditingId(null)}
                        onDelete={() => handleDelete(subject.id)}
                        deleteDisabled={isPending || subject.classCount > 0}
                        deleteTitle={subject.classCount > 0 ? 'Tidak bisa dihapus — masih digunakan kelas' : ''}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EditRow({ subject, onDone, onDelete, deleteDisabled, deleteTitle }: {
  subject: Subject
  onDone: () => void
  onDelete: () => void
  deleteDisabled: boolean
  deleteTitle: string
}) {
  const action = updateSubject.bind(null, subject.id)
  const [state, formAction, pending] = useActionState(action, null)

  if (state && 'success' in state) {
    onDone()
    return null
  }

  return (
    <form action={formAction} className="px-5 py-3 bg-blue-50/40 space-y-2">
      {state && 'error' in state && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <input
        name="name"
        type="text"
        required
        defaultValue={subject.name}
        className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <div>
        <p className="text-xs text-gray-500 mb-2">Kurikulum</p>
        <CurriculumSelector defaultValues={subject.curriculum} />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Jenjang</p>
        <LevelSelector defaultValues={subject.level} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-60">
            {pending ? '...' : 'Simpan'}
          </button>
          <button type="button" onClick={onDone} className="px-3 py-1.5 border text-xs font-medium rounded-lg text-gray-600 hover:bg-white">
            Batal
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteDisabled}
          title={deleteTitle}
          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Hapus
        </button>
      </div>
    </form>
  )
}
