import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { getMasteryRecap } from '@/lib/reports/mastery-recap'
import MasteryRecapTable from '@/components/rekap/MasteryRecapTable'
import ClassPicker from '@/components/rekap/ClassPicker'

export const metadata = { title: 'Rekap Penguasaan' }

export default async function TutorRekapPenguasaanPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>
}) {
  const { class: classId } = await searchParams
  const user = await getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name')
    .eq('tutor_id', user.id)
    .eq('is_active', true)
    .order('name')

  const ownClassIds = new Set((classes ?? []).map(c => c.id as string))

  // Kelas dari query string diperiksa ulang di sini: halaman ini memakai service
  // role, jadi tanpa pemeriksaan ini seorang tutor bisa membaca rekap kelas orang
  // lain hanya dengan mengubah URL.
  const allowed = classId && ownClassIds.has(classId) ? classId : null
  const recap = allowed ? await getMasteryRecap(allowed) : null

  return (
    <div className="p-6 max-w-full mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Rekap Penguasaan</h1>
      <p className="mt-1 text-sm text-gray-500">
        Penguasaan per topik dari latihan mandiri murid di kelas yang kamu ajar.
      </p>

      <div className="mt-4">
        <ClassPicker classes={classes ?? []} selected={allowed} />
      </div>

      <div className="mt-6">
        {recap ? (
          <MasteryRecapTable recap={recap} />
        ) : (
          <p className="rounded border border-slate-200 bg-white p-6 text-sm text-gray-500">
            {classId && !allowed
              ? 'Kelas itu bukan kelas yang kamu ajar.'
              : 'Pilih kelas untuk melihat rekapnya.'}
          </p>
        )}
      </div>
    </div>
  )
}
