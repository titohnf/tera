import { createAdminClient } from '@/lib/supabase/server-admin'
import { getMasteryRecap } from '@/lib/reports/mastery-recap'
import MasteryRecapTable from '@/components/rekap/MasteryRecapTable'
import ClassPicker from '@/components/rekap/ClassPicker'

export const metadata = { title: 'Rekap Penguasaan' }

export default async function RekapPenguasaanPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>
}) {
  const { class: classId } = await searchParams
  const admin = createAdminClient()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const recap = classId ? await getMasteryRecap(classId) : null

  return (
    <div className="p-6 max-w-full mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Rekap Penguasaan</h1>
      <p className="mt-1 text-sm text-gray-500">
        Penguasaan per topik dari latihan mandiri, satu kelas dalam satu layar.
      </p>

      <div className="mt-4">
        <ClassPicker classes={classes ?? []} selected={classId ?? null} />
      </div>

      <div className="mt-6">
        {recap ? (
          <MasteryRecapTable recap={recap} />
        ) : (
          <p className="rounded border border-slate-200 bg-white p-6 text-sm text-gray-500">
            Pilih kelas untuk melihat rekapnya.
          </p>
        )}
      </div>
    </div>
  )
}
