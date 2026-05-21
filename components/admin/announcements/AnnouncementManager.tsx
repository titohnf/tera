'use client'

import { useActionState, useState, useTransition } from 'react'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncement } from '@/lib/actions/admin/announcements'

type Announcement = {
  id: string
  title: string
  body: string
  target_roles: string[] | null
  is_active: boolean
  published_at: string
  profiles: { full_name: string } | null
}

const ROLE_OPTIONS = [
  { value: 'tutor', label: 'Tutor' },
  { value: 'student', label: 'Siswa' },
  { value: 'parent', label: 'Orang Tua' },
]

function RoleCheckboxes({ defaultValues }: { defaultValues?: string[] | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">Target (kosongkan = semua)</p>
      <div className="flex gap-4">
        {ROLE_OPTIONS.map(r => (
          <label key={r.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              name="target_roles"
              value={r.value}
              defaultChecked={defaultValues?.includes(r.value)}
              className="rounded"
            />
            {r.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function AnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createState, createAction, createPending] = useActionState(createAnnouncement, null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    startTransition(async () => { await deleteAnnouncement(id) })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => { await toggleAnnouncement(id, !current) })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Buat Pengumuman</h2>
        <form action={createAction} className="space-y-3">
          {createState && 'error' in createState && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createState.error}</div>
          )}
          {createState && 'success' in createState && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{createState.success}</div>
          )}
          <input
            name="title"
            type="text"
            required
            placeholder="Judul pengumuman *"
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Isi pengumuman *"
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <RoleCheckboxes />
          <button
            type="submit"
            disabled={createPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {createPending ? 'Memposting...' : 'Posting'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-300 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Semua Pengumuman ({announcements.length})
          </p>
        </div>

        {announcements.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">Belum ada pengumuman.</div>
        ) : (
          <div className="divide-y divide-slate-300">
            {announcements.map(a => (
              <div key={a.id}>
                {editingId === a.id ? (
                  <EditRow announcement={a} onDone={() => setEditingId(null)} />
                ) : (
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                          {!a.is_active && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Nonaktif</span>
                          )}
                          {a.target_roles && a.target_roles.length > 0 && (
                            <div className="flex gap-1">
                              {a.target_roles.map(r => (
                                <span key={r} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize">{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {a.profiles?.full_name ? ` · ${a.profiles.full_name}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggle(a.id, a.is_active)}
                          disabled={isPending}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-40"
                        >
                          {a.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => setEditingId(a.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditRow({ announcement, onDone }: { announcement: Announcement; onDone: () => void }) {
  const action = updateAnnouncement.bind(null, announcement.id)
  const [state, formAction, pending] = useActionState(action, null)

  if (state && 'success' in state) {
    onDone()
    return null
  }

  return (
    <form action={formAction} className="px-5 py-4 bg-blue-50/40 space-y-3">
      {state && 'error' in state && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <input
        name="title"
        type="text"
        required
        defaultValue={announcement.title}
        className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <textarea
        name="body"
        required
        rows={3}
        defaultValue={announcement.body}
        className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
      />
      <RoleCheckboxes defaultValues={announcement.target_roles} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-60">
          {pending ? '...' : 'Simpan'}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 border text-xs font-medium rounded-lg text-gray-600 hover:bg-white">
          Batal
        </button>
      </div>
    </form>
  )
}
