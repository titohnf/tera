import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  subjects: { name: string } | null
}

type StudentCountRow = { class_id: string }

type NextSessionRow = {
  class_id: string
  scheduled_at: string
  status: string
}

export default async function TutorClassesPage() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, is_active, subjects(name)')
    .eq('tutor_id', user.id)
    .order('name') as unknown as { data: ClassRow[] | null }

  const classIds = (classes ?? []).map(c => c.id)

  let studentCounts: StudentCountRow[] = []
  let nextSessions: NextSessionRow[] = []

  if (classIds.length > 0) {
    const [{ data: students }, { data: sessions }] = await Promise.all([
      admin
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('is_active', true) as unknown as Promise<{ data: StudentCountRow[] | null }>,

      admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', classIds)
        .in('status', ['scheduled', 'ongoing'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true }) as unknown as Promise<{ data: NextSessionRow[] | null }>,
    ])
    studentCounts = students ?? []
    nextSessions = sessions ?? []
  }

  const countByClass: Record<string, number> = {}
  for (const s of studentCounts) {
    countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1
  }

  const nextByClass: Record<string, NextSessionRow> = {}
  for (const s of nextSessions) {
    if (!nextByClass[s.class_id]) nextByClass[s.class_id] = s
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Kelas Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar kelas yang kamu ampu.</p>
      </div>

      {(classes ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Kamu belum ditugaskan ke kelas manapun.
        </div>
      ) : (
        <div className="space-y-3">
          {(classes ?? []).map(cls => {
            const studentCount = countByClass[cls.id] ?? 0
            const next = nextByClass[cls.id]
            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                      {cls.level && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{cls.level}</span>
                      )}
                      {!cls.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Nonaktif</span>
                      )}
                    </div>
                    {cls.subjects?.name && (
                      <p className="text-xs text-gray-500">{cls.subjects.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Siswa terdaftar</p>
                    <p className="text-lg font-bold text-gray-800">{studentCount}</p>
                  </div>
                </div>

                {next && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Sesi berikutnya</p>
                      <p className="text-sm font-medium text-blue-700">
                        {new Date(next.scheduled_at).toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })}
                        {' — '}
                        {new Date(next.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Link
                      href={`/tutor/schedule`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Lihat jadwal →
                    </Link>
                  </div>
                )}

                {!next && cls.is_active && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-400">Tidak ada sesi terjadwal.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
