import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '@/components/notes/NoteEditor'
import { rosterForSession } from '@/lib/enrollment'

export default async function NotesPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, class_id, topic, scheduled_at, classes(name)')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()

  if (!session) notFound()

  const { data: allEnrollments } = await supabase
    .from('class_students')
    .select('student_id, enrolled_at, unenrolled_at, is_active, profiles(id, full_name)')
    .eq('class_id', session.class_id)

  const enrolledStudents = rosterForSession(allEnrollments ?? [], session.scheduled_at)

  const { data: existingNotes } = await supabase
    .from('performance_notes')
    .select('student_id, body, template_id')
    .eq('session_id', sessionId)

  const { data: templates } = await supabase
    .from('performance_note_templates')
    .select('id, category, label, body')
    .eq('is_active', true)
    .order('category')

  const noteMap = Object.fromEntries(
    (existingNotes ?? []).map(n => [n.student_id, n])
  )

  const students = (enrolledStudents ?? []).map(cs => {
    const profile = (cs.profiles as unknown as { id: string; full_name: string } | null)
    return {
      id: profile?.id ?? cs.student_id,
      full_name: profile?.full_name ?? 'Siswa',
      existingNote: noteMap[cs.student_id] ?? null,
    }
  })

  const cls = (session.classes as unknown as { name: string } | null)
  const notedCount = students.filter(s => s.existingNote).length

  return (
    <div>
      <Link
        href={`/tutor/sessions/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Detail Sesi
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Catatan Performa</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cls?.name}</p>
        </div>
        <span className="text-sm text-gray-500">
          <strong className="text-gray-900">{notedCount}</strong> / {students.length} sudah dicatat
        </span>
      </div>

      <NoteEditor
        sessionId={sessionId}
        students={students}
        templates={templates ?? []}
      />
    </div>
  )
}
