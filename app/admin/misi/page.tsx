import { createAdminClient } from '@/lib/supabase/server-admin'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import IsiKetuntasan from '@/components/keluarga/IsiKetuntasan'

export const metadata = { title: 'Ketuntasan Materi' }

/**
 * Ketuntasan Materi seorang siswa, dilihat admin — isinya komponen yang sama
 * dengan halaman Ketuntasan Materi di portal keluarga (`IsiKetuntasan`), jadi
 * angka dan urutannya tidak bisa berbeda dengan yang dibaca orang tua.
 *
 * Angkanya datang dari `topik_kemajuan()`, yang gerbangnya `practice_actor()`.
 * Admin baru lolos sejak migrasi 208; sebelum itu daftarnya selalu kosong.
 *
 * Tautan rincian per topik dimatikan (`rincian={false}`): rutenya milik portal
 * keluarga dan tertutup bagi admin.
 */
export default async function MisiAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>
}) {
  const { student_id } = await searchParams
  const admin = createAdminClient()

  const { data: students } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name')

  const options = (students ?? []).map(s => ({
    value: s.id as string,
    label: (s.full_name as string | null) ?? '(tanpa nama)',
  }))

  // Hanya membaca, tidak melahirkan baris `learners` untuk siswa yang belum
  // pernah berlatih — sama seperti `learnerAnak()` di portal keluarga.
  const learnerId = student_id
    ? (
        await admin
          .from('learners')
          .select('id')
          .eq('profile_id', student_id)
          .maybeSingle()
      ).data?.id ?? null
    : null

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Ketuntasan Materi</h1>
      <p className="text-sm text-gray-500 mt-1">
        Ketuntasan paket latihan Matematika siswa di menu Misi, sama seperti yang dilihat orang tua.
      </p>

      <div className="mt-4 mb-6">
        <StudentSelect options={options} value={student_id ?? ''} />
      </div>

      {student_id ? (
        <IsiKetuntasan studentId={student_id} learnerId={learnerId as string | null} rincian={false} />
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Pilih siswa untuk melihat ketuntasan materinya.
        </p>
      )}
    </div>
  )
}
