import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { redirect } from 'next/navigation'
import TutorProfileForm from '@/components/tutor/profile/TutorProfileForm'
import TutorSubjectPicker from '@/components/tutor/profile/TutorSubjectPicker'
import TutorAvailabilityPicker from '@/components/tutor/profile/TutorAvailabilityPicker'

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: profile }, { data: subjects }, { data: tutorSubjects }, { data: availability }] = await Promise.all([
    admin.from('profiles').select('full_name, email, phone').eq('id', user.id).single(),
    admin.from('subjects').select('id, name, level').order('name'),
    admin.from('tutor_subjects').select('subject_id, level').eq('tutor_id', user.id),
    admin.from('tutor_availability').select('day_of_week, start_time, end_time').eq('tutor_id', user.id),
  ])

  const selectedRows = (tutorSubjects ?? []).map(ts => ({ subject_id: ts.subject_id, level: ts.level ?? '' }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun dan keamanan.</p>
      </div>

      <div className="space-y-5">
        <TutorProfileForm
          fullName={profile?.full_name ?? ''}
          phone={profile?.phone ?? ''}
          email={profile?.email ?? user.email ?? ''}
        />

        <TutorSubjectPicker
          subjects={(subjects ?? []) as { id: string; name: string; level: string[] | null }[]}
          selectedRows={selectedRows}
        />

        <TutorAvailabilityPicker
          slots={(availability ?? []) as { day_of_week: number; start_time: string; end_time: string }[]}
        />
      </div>
    </div>
  )
}
