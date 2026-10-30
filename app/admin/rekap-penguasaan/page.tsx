import { createAdminClient } from '@/lib/supabase/server-admin'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import IsiPenguasaan from '@/components/keluarga/IsiPenguasaan'

export const metadata = { title: 'Latihan Mandiri' }

/**
 * Latihan Mandiri seorang siswa, dilihat admin — komponen yang sama dengan
 * halaman Latihan Mandiri di portal keluarga (`IsiPenguasaan`), jadi angka dan
 * urutannya tidak bisa berbeda dengan yang dibaca orang tua.
 *
 * Angkanya dari `practice_topic_progress()`, yang gerbangnya `practice_actor()`.
 * Admin baru lolos sejak migrasi 208; sebelum itu daftarnya selalu kosong.
 *
 * Tidak ada tampilan per kelas di sini. Matriks siswa × topik untuk satu kelas
 * menghitung angkanya sendiri dari `practice_answers`, terpisah dari fungsi
 * yang dipakai portal keluarga, jadi bisa menampilkan angka berbeda untuk anak
 * yang sama. Matriks itu tetap ada di halaman tutor (`/tutor/rekap-penguasaan`).
 *
 * Hasil Misi tidak termasuk; itu ada di menu Ketuntasan Materi. Tautan rincian
 * per topik dimatikan (`rincian={false}`): rutenya milik portal keluarga dan
 * tertutup bagi admin.
 */
export default async function LatihanMandiriAdminPage({
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
      <h1 className="text-xl font-semibold text-gray-900">Latihan Mandiri</h1>
      <p className="text-sm text-gray-500 mt-1">
        Penguasaan per topik dari soal yang dikerjakan siswa di menu Belajar, sama seperti yang
        dilihat orang tua. Hasil Misi ada di Ketuntasan Materi.
      </p>

      <div className="mt-4 mb-6">
        <StudentSelect options={options} value={student_id ?? ''} />
      </div>

      {student_id ? (
        <IsiPenguasaan studentId={student_id} learnerId={learnerId as string | null} rincian={false} />
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Pilih siswa untuk melihat penguasaannya.
        </p>
      )}
    </div>
  )
}
