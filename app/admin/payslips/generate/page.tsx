import { createAdminClient } from '@/lib/supabase/server-admin'
import GeneratePayslipForm from '@/components/admin/payslips/GeneratePayslipForm'
import type { ProfileRow } from '@/lib/types/database'

export default async function GeneratePayslipPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tutor_id?: string }>
}) {
  const { month, tutor_id } = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = month ?? defaultMonth

  const admin = createAdminClient()
  const { data: tutors } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'tutor')
    .order('full_name') as unknown as { data: Pick<ProfileRow, 'id' | 'full_name' | 'email'>[] | null }

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Buat Slip Gaji</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih tutor dan bulan kerja untuk membuat slip gaji.
        </p>
      </div>
      <GeneratePayslipForm
        tutors={tutors ?? []}
        monthOptions={monthOptions}
        defaultMonth={selectedMonth}
        defaultTutorId={tutor_id}
      />
    </div>
  )
}
