import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  profiles: { full_name: string } | null
  class_subjects: { subjects: { name: string } | null }[]
}

export default async function ClassesPage() {
  const admin = createAdminClient()

  const [{ data: classes }, { data: enrollments }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, is_active, profiles!tutor_id(full_name), class_subjects(subjects(name))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: ClassRow[] | null }>,
    admin
      .from('class_students')
      .select('class_id')
      .eq('is_active', true),
  ])

  const countByClass: Record<string, number> = {}
  for (const e of enrollments ?? []) {
    countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Manajemen Kelas</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sessions"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50/50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kalender Sesi
          </Link>
          <Link
            href="/admin/classes/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kelas
          </Link>
        </div>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Belum ada kelas. Mulai dengan menambahkan kelas baru.
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map(cls => (
            <Link
              key={cls.id}
              href={`/admin/classes/${cls.id}`}
              className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                    {cls.level && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {cls.level}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      cls.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cls.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {cls.class_subjects?.length > 0
                      ? cls.class_subjects.map(cs => cs.subjects?.name).filter(Boolean).join(', ')
                      : 'Mata pelajaran umum'} &bull; Tutor: {cls.profiles?.full_name ?? '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{countByClass[cls.id] ?? 0}</p>
                  <p className="text-xs text-gray-500">siswa</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

