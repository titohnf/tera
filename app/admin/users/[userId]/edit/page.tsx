import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditUserForm from '@/components/admin/users/EditUserForm'
import TutorSubjectPicker from '@/components/tutor/profile/TutorSubjectPicker'
import TutorAvailabilityPicker from '@/components/tutor/profile/TutorAvailabilityPicker'
import { adminUpdateTutorSubjects, adminUpdateTutorAvailability } from '@/lib/actions/admin/users'

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, level, grade, parent_name, nickname, birth_date, parent_phone, avatar_url')
    .eq('id', userId)
    .single()

  if (!user) notFound()

  let subjects: { id: string; name: string; level: string[] | null }[] = []
  let selectedRows: { subject_id: string; level: string }[] = []
  let availability: { day_of_week: number; start_time: string; end_time: string }[] = []

  if (user.role === 'tutor') {
    const [{ data: subjectsData }, { data: tutorSubjects }, { data: availabilityData }] = await Promise.all([
      admin.from('subjects').select('id, name, level').order('name'),
      admin.from('tutor_subjects').select('subject_id, level').eq('tutor_id', userId),
      admin.from('tutor_availability').select('day_of_week, start_time, end_time').eq('tutor_id', userId),
    ])
    subjects = subjectsData ?? []
    selectedRows = (tutorSubjects ?? []).map(ts => ({ subject_id: ts.subject_id, level: ts.level ?? '' }))
    availability = availabilityData ?? []
  }

  const ROLE_BREADCRUMB: Record<string, { label: string; href: string }> = {
    tutor:   { label: 'Tutor',      href: '/admin/tutor' },
    student: { label: 'Siswa',      href: '/admin/siswa' },
    admin:   { label: 'Admin',      href: '/admin/users' },
    parent:  { label: 'Orang Tua',  href: '/admin/users' },
  }
  const crumb = ROLE_BREADCRUMB[user.role] ?? { label: 'Pengguna', href: '/admin/users' }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={crumb.href} className="hover:text-blue-600">{crumb.label}</Link>
        <span>/</span>
        <Link href={`/admin/users/${userId}`} className="hover:text-blue-600">{user.full_name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      <div className="max-w-xl space-y-5">
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <h1 className="text-sm font-semibold text-gray-700 mb-4">Edit Data Pengguna</h1>
          <EditUserForm
            userId={userId}
            hideRole={user.role === 'student'}
            defaultValues={{
              full_name: user.full_name,
              phone: (user as any).phone ?? null,
              role: user.role,
              level: (user as any).level ?? null,
              grade: (user as any).grade ?? null,
              parent_name: (user as any).parent_name ?? null,
              nickname: (user as any).nickname ?? null,
              birth_date: (user as any).birth_date ?? null,
              parent_phone: (user as any).parent_phone ?? null,
              avatar_url: (user as any).avatar_url ?? null,
            }}
          />
        </div>

        {user.role === 'tutor' && (
          <>
            <TutorSubjectPicker
              subjects={subjects}
              selectedRows={selectedRows}
              onSave={adminUpdateTutorSubjects.bind(null, userId)}
            />
            <TutorAvailabilityPicker
              slots={availability}
              onSave={adminUpdateTutorAvailability.bind(null, userId)}
            />
          </>
        )}
      </div>
    </div>
  )
}
