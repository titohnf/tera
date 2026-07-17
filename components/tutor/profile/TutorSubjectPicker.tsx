'use client'

import { useState, useTransition } from 'react'
import { updateTutorSubjects } from '@/lib/actions/tutor/subjects'

type Subject = { id: string; name: string; level: string[] | null }

const LEVEL_ORDER = ['SD', 'SMP', 'SMA', 'Umum']

function groupByLevel(subjects: Subject[]): { label: string; items: Subject[] }[] {
  const groups: Record<string, Subject[]> = {}
  for (const l of LEVEL_ORDER) groups[l] = []

  for (const s of subjects) {
    const levels = s.level && s.level.length > 0 ? s.level : ['Umum']
    for (const l of levels) {
      const key = LEVEL_ORDER.includes(l) ? l : 'Umum'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
  }

  return LEVEL_ORDER
    .filter(l => groups[l]?.length > 0)
    .map(l => ({ label: l, items: groups[l] }))
}

// key format: "subjectId|level"
function makeKey(subjectId: string, level: string) {
  return `${subjectId}|${level}`
}

export default function TutorSubjectPicker({
  subjects,
  selectedRows,
  onSave = updateTutorSubjects,
}: {
  subjects: Subject[]
  selectedRows: { subject_id: string; level: string }[]
  onSave?: (selections: { subject_id: string; level: string }[]) => Promise<{ error: string } | null>
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedRows.map(r => makeKey(r.subject_id, r.level)))
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggle(subjectId: string, level: string) {
    setSaved(false)
    const key = makeKey(subjectId, level)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    const selections = [...selected].map(key => {
      const [subject_id, level] = key.split('|')
      return { subject_id, level }
    })
    startTransition(async () => {
      const result = await onSave(selections)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const initialKeys = new Set(selectedRows.map(r => makeKey(r.subject_id, r.level)))
  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialKeys].sort())

  const groups = groupByLevel(subjects)

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Mata Pelajaran yang Diajar</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pilih mapel dan jenjang yang ingin kamu ajar. Ini membantu admin menemukan tutor yang sesuai.
          </p>
        </div>
        <span className="text-xs text-gray-400 mt-0.5">{selected.size} dipilih</span>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">Belum ada mata pelajaran. Hubungi admin.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="flex gap-2 flex-wrap">
                {group.items.map(s => {
                  const key = makeKey(s.id, group.label)
                  const isSelected = selected.has(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(s.id, group.label)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                      }`}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pilihan'}
        </button>
        {saved && !hasChanges && (
          <span className="text-sm text-green-600 font-medium">Tersimpan</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
