import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

type ClassRow = {
  id: string
  name: string
  level: string | null
  base_price_per_session: number
  is_active: boolean
  profiles: { full_name: string } | null
  subjects: { name: string } | null
}

type SchemeRow = {
  class_id: string
  base_amount: number
  bonus_type: string
  bonus_threshold: number | null
  bonus_amount: number
}

export default async function PricingPage() {
  const admin = createAdminClient()

  const [{ data: classes }, { data: schemes }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, base_price_per_session, is_active, profiles!tutor_id(full_name), subjects(name)')
      .order('is_active', { ascending: false })
      .order('name') as unknown as Promise<{ data: ClassRow[] | null }>,
    admin
      .from('salary_schemes')
      .select('class_id, base_amount, bonus_type, bonus_threshold, bonus_amount') as unknown as Promise<{ data: SchemeRow[] | null }>,
  ])

  const schemeByClass = Object.fromEntries((schemes ?? []).map(s => [s.class_id, s]))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Manajemen Harga Kelas</h1>
        <p className="text-sm text-gray-500 mt-1">Atur harga siswa dan skema gaji tutor per kelas.</p>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Belum ada kelas.{' '}
          <Link href="/admin/classes/new" className="text-blue-600 hover:underline">Tambah kelas</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map(cls => {
            const scheme = schemeByClass[cls.id]
            const hasScheme = !!scheme
            return (
              <Link
                key={cls.id}
                href={`/admin/pricing/${cls.id}`}
                className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                    {cls.level && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{cls.level}</span>
                    )}
                    {!cls.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Nonaktif</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {cls.subjects?.name ?? 'Umum'} &bull; {cls.profiles?.full_name ?? '-'}
                  </p>
                </div>

                <div className="flex items-center gap-8 shrink-0 ml-4">
                  {/* Student price */}
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-0.5">Harga siswa</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatRp(cls.base_price_per_session)}
                    </p>
                    <p className="text-sm text-gray-400">/ sesi</p>
                  </div>

                  {/* Tutor salary */}
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-0.5">Gaji tutor</p>
                    {hasScheme ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800">{formatRp(scheme.base_amount)}</p>
                        <p className="text-sm text-gray-400">
                          {scheme.bonus_type === 'student_count'
                            ? `+ ${formatRp(scheme.bonus_amount)} bonus`
                            : 'tanpa bonus'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-amber-600">Belum diatur</p>
                        <p className="text-sm text-gray-400">–</p>
                      </>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {classes && classes.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4">
            <p className="text-sm text-gray-500">Total Kelas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4">
            <p className="text-sm text-gray-500">Sudah Ada Skema Gaji</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{schemes?.length ?? 0}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-600">Belum Ada Skema Gaji</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {classes.length - (schemes?.length ?? 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
