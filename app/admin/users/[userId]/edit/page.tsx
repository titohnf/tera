import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditUserForm from '@/components/admin/users/EditUserForm'
import PasswordResetButton from '@/components/admin/users/PasswordResetButton'
import { adalahEmailTeknis } from '@/lib/akun-keluarga'
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

  // Akun orang tua yang tertaut ke siswa ini (`family_students`). Dua kueri, bukan
  // embed: kunci asingnya mengarah ke `profiles` dari dua kolom sekaligus.
  let keluarga: { id: string; full_name: string; email: string | null }[] = []
  if (user.role === 'student') {
    const { data: tautan } = await admin.from('family_students').select('family_id').eq('student_id', userId)
    const ids = (tautan ?? []).map(t => t.family_id as string)
    if (ids.length > 0) {
      const { data: akun } = await admin.from('profiles').select('id, full_name, email').in('id', ids).order('full_name')
      keluarga = (akun ?? []) as typeof keluarga
    }
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
          {/* Email login, hanya dibaca. Untuk siswa, login ada di akun orang tua yang
              tertaut — profil siswa sendiri tidak bisa masuk dan emailnya teknis. */}
          <div className="mb-5 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Email login</p>
            {user.role === 'student' ? (
              keluarga.length > 0 ? (
                keluarga.map(k => (
                  <p key={k.id} className="mt-1 text-sm text-gray-900 break-all">
                    {k.email} <span className="text-xs text-gray-400">· akun orang tua {k.full_name}</span>
                  </p>
                ))
              ) : user.email && !adalahEmailTeknis(user.email as string) ? (
                <p className="mt-1 text-sm text-gray-900 break-all">
                  {user.email as string}
                  <span className="block text-xs text-amber-600">Belum tertaut ke akun orang tua — belum bisa masuk portal</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Belum ada</p>
              )
            ) : (
              <p className="mt-1 text-sm text-gray-900 break-all">{(user.email as string) || '—'}</p>
            )}
          </div>
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

        {/* Password: dikembalikan ke default awal oleh admin. Orang tua yang lupa
            password dicari lewat anaknya di sini, karena tidak ada daftar akun
            orang tua di menu admin. */}
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Password</h2>
          {/* Profil siswa tidak bisa login (hanya akun orang tua yang bisa), jadi
              reset password-nya tidak berarti apa-apa dan tombolnya tidak ditampilkan. */}
          {user.role !== 'student' && (
            <div>
              <p className="text-sm text-gray-900 mb-2">Akun ini: {user.full_name}</p>
              <PasswordResetButton userId={userId} nama={user.full_name} />
            </div>
          )}
          {user.role === 'student' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Akun orang tua</p>
              {keluarga.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada akun orang tua yang tertaut ke siswa ini, jadi belum ada yang bisa masuk ke portal.</p>
              ) : (
                keluarga.map(k => (
                  <div key={k.id}>
                    <p className="text-sm text-gray-900">{k.full_name}</p>
                    {k.email && <p className="text-xs text-gray-400 mb-2">{k.email}</p>}
                    <PasswordResetButton userId={k.id} nama={k.full_name} />
                  </div>
                ))
              )}
            </div>
          )}
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
