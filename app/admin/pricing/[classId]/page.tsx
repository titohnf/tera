import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClassPriceForm from '@/components/admin/pricing/ClassPriceForm'
import SalarySchemeForm from '@/components/admin/pricing/SalarySchemeForm'
import type { SalarySchemeRow } from '@/lib/types/database'

export default async function ClassPricingPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const admin = createAdminClient()

  const [{ data: cls }, { data: scheme }, { data: enrollments }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, base_price_per_session, tutor_id, is_active, profiles!tutor_id(full_name, email), subjects(name)')
      .eq('id', classId)
      .single() as unknown as Promise<{
        data: {
          id: string; name: string; level: string | null
          base_price_per_session: number; tutor_id: string; is_active: boolean
          profiles: { full_name: string; email: string } | null
          subjects: { name: string } | null
        } | null
      }>,
    admin
      .from('salary_schemes')
      .select('*')
      .eq('class_id', classId)
      .single() as unknown as Promise<{ data: SalarySchemeRow | null }>,
    admin
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('is_active', true),
  ])

  if (!cls) notFound()

  const studentCount = enrollments ?? 0

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/pricing" className="hover:text-blue-600">Harga Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cls.name}</span>
      </div>

      {/* Class info */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold text-gray-900">{cls.name}</h1>
          {cls.level && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{cls.level}</span>}
          {!cls.is_active && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Nonaktif</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {cls.subjects?.name ?? 'Umum'} &bull; Tutor: {cls.profiles?.full_name ?? '-'} &bull; {studentCount} siswa aktif
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Student price */}
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Harga Siswa</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">Biaya yang dikenakan kepada siswa per pertemuan.</p>
          <ClassPriceForm classId={classId} currentPrice={cls.base_price_per_session} />
        </div>

        {/* Tutor salary scheme */}
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Skema Gaji Tutor</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Gaji pokok + bonus untuk {cls.profiles?.full_name ?? 'tutor'} per sesi mengajar.
          </p>

          {scheme && (
            <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Gaji pokok</span>
                <span className="font-medium">{formatRp(scheme.base_amount)}</span>
              </div>
              {scheme.bonus_type === 'student_count' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bonus jika ≥ {scheme.bonus_threshold} siswa hadir</span>
                    <span className="font-medium text-green-600">+{formatRp(scheme.bonus_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-gray-500">Maks. total</span>
                    <span className="font-semibold">{formatRp(scheme.base_amount + scheme.bonus_amount)}</span>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-400 pt-1">
                Berlaku sejak {new Date(scheme.effective_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          <SalarySchemeForm classId={classId} tutorId={cls.tutor_id} existing={scheme} />
        </div>
      </div>

      {/* Margin info */}
      {scheme && (
        <div className="mt-6 bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Estimasi Margin per Sesi</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Pendapatan dari Siswa</p>
              <p className="font-semibold text-blue-700">{formatRp(cls.base_price_per_session)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 mb-1">Biaya Tutor (maks.)</p>
              <p className="font-semibold text-red-700">
                {formatRp(scheme.base_amount + (scheme.bonus_type === 'student_count' ? scheme.bonus_amount : 0))}
              </p>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              cls.base_price_per_session - scheme.base_amount - scheme.bonus_amount >= 0
                ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              <p className={`text-xs mb-1 ${
                cls.base_price_per_session - scheme.base_amount - scheme.bonus_amount >= 0
                  ? 'text-green-600' : 'text-amber-600'
              }`}>Margin (per siswa)</p>
              <p className={`font-semibold ${
                cls.base_price_per_session - scheme.base_amount - scheme.bonus_amount >= 0
                  ? 'text-green-700' : 'text-amber-700'
              }`}>
                {formatRp(cls.base_price_per_session - scheme.base_amount - (scheme.bonus_type === 'student_count' ? scheme.bonus_amount : 0))}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            * Margin dihitung dari harga siswa dikurangi biaya tutor maksimal (termasuk bonus). Nilai aktual tergantung kehadiran siswa.
          </p>
        </div>
      )}
    </div>
  )
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
