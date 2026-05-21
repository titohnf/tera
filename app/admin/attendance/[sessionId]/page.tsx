import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type AttendanceDetail = {
  id: string
  status: string
  notes: string | null
  marked_at: string
  profiles: { full_name: string } | null
}

type SessionRow = {
  id: string
  scheduled_at: string
  topic: string | null
  classes: { name: string; id: string } | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  present: { label: 'Hadir', color: 'text-green-600 bg-green-50' },
  late:    { label: 'Terlambat', color: 'text-yellow-600 bg-yellow-50' },
  absent:  { label: 'Absen', color: 'text-red-600 bg-red-50' },
  excused: { label: 'Izin', color: 'text-gray-600 bg-gray-100' },
}

export default async function SessionAttendanceDetail({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const admin = createAdminClient()

  const [{ data: session }, { data: attendances }] = await Promise.all([
    admin
      .from('sessions')
      .select('id, scheduled_at, topic, classes(name, id)')
      .eq('id', sessionId)
      .single() as unknown as Promise<{ data: SessionRow | null }>,
    admin
      .from('attendances')
      .select('id, status, notes, marked_at, profiles!student_id(full_name)')
      .eq('session_id', sessionId)
      .order('status') as unknown as Promise<{ data: AttendanceDetail[] | null }>,
  ])

  if (!session) notFound()

  const date = new Date(session.scheduled_at)
  const summary = { present: 0, late: 0, absent: 0, excused: 0 }
  for (const a of attendances ?? []) {
    if (a.status in summary) summary[a.status as keyof typeof summary]++
  }
  const total = Object.values(summary).reduce((s, n) => s + n, 0)

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/attendance?class_id=${session.classes?.id}`}
          className="text-xs text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Kembali ke Laporan Kehadiran
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Detail Kehadiran Sesi</h1>
        <p className="text-sm text-gray-500 mt-1">
          {session.classes?.name} ·{' '}
          {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {session.topic ? ` · ${session.topic}` : ''}
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-6">
        {(['present', 'late', 'absent', 'excused'] as const).map(s => (
          <div key={s} className={`px-4 py-2 rounded-lg text-sm font-semibold ${STATUS_LABEL[s].color}`}>
            {STATUS_LABEL[s].label}: {summary[s]}
          </div>
        ))}
        <div className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-50">
          Total: {total}
        </div>
      </div>

      {/* Per-student table */}
      {(attendances ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Belum ada data kehadiran untuk sesi ini.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Siswa</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Catatan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Dicatat</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(attendances ?? []).map(a => {
                const st = STATUS_LABEL[a.status] ?? { label: a.status, color: 'text-gray-500 bg-gray-50' }
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {a.profiles?.full_name ?? '—'}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.notes ?? '—'}</td>
                    <td className="text-right px-5 py-3 text-xs text-gray-400">
                      {new Date(a.marked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
