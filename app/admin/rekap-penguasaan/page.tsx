import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getMasteryRecap } from '@/lib/reports/mastery-recap'
import MasteryRecapTable from '@/components/rekap/MasteryRecapTable'
import ClassPicker from '@/components/rekap/ClassPicker'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import IsiPenguasaan from '@/components/keluarga/IsiPenguasaan'

export const metadata = { title: 'Latihan Mandiri' }

/**
 * Latihan Mandiri (menu Rekap Penguasaan), dilihat admin.
 *
 * Dua tampilan atas sumber yang sama (soal yang dikerjakan di menu Belajar):
 *
 * - **Per Siswa** — komponen yang sama dengan halaman Latihan Mandiri di portal
 *   keluarga (`IsiPenguasaan`). Angkanya dari `practice_topic_progress()`, yang
 *   baru bisa dibaca admin sejak migrasi 208.
 * - **Per Kelas** — matriks siswa × topik untuk satu kelas, dihitung
 *   `getMasteryRecap()`. Halaman tutor memakai matriks yang sama.
 *
 * Hasil Misi tidak termasuk di kedua tampilan; itu ada di menu Misi.
 */
export default async function RekapPenguasaanPage({
  searchParams,
}: {
  searchParams: Promise<{ tampil?: string; class?: string; student_id?: string }>
}) {
  const { tampil, class: classId, student_id } = await searchParams
  const perKelas = tampil === 'kelas'

  return (
    <div className="p-6 max-w-full mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Latihan Mandiri</h1>
      <p className="mt-1 text-sm text-gray-500">
        Penguasaan per topik dari soal yang dikerjakan di menu Belajar. Hasil Misi tidak termasuk.
      </p>

      <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <Link
          href="/admin/rekap-penguasaan"
          className={`rounded-md px-3 py-1.5 font-medium ${
            perKelas ? 'text-gray-500 hover:text-gray-700' : 'bg-white text-gray-900 shadow-sm'
          }`}
        >
          Per Siswa
        </Link>
        <Link
          href="/admin/rekap-penguasaan?tampil=kelas"
          className={`rounded-md px-3 py-1.5 font-medium ${
            perKelas ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Per Kelas
        </Link>
      </div>

      {perKelas ? <PerKelas classId={classId} /> : <PerSiswa studentId={student_id} />}
    </div>
  )
}

async function PerKelas({ classId }: { classId?: string }) {
  const admin = createAdminClient()
  const { data: classes } = await admin
    .from('classes')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const recap = classId ? await getMasteryRecap(classId) : null

  return (
    <>
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
    </>
  )
}

async function PerSiswa({ studentId }: { studentId?: string }) {
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
  const learnerId = studentId
    ? (
        await admin
          .from('learners')
          .select('id')
          .eq('profile_id', studentId)
          .maybeSingle()
      ).data?.id ?? null
    : null

  return (
    <div className="max-w-2xl">
      <div className="mt-4 mb-6">
        <StudentSelect options={options} value={studentId ?? ''} />
      </div>

      {studentId ? (
        <IsiPenguasaan studentId={studentId} learnerId={learnerId as string | null} rincian={false} />
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Pilih siswa untuk melihat penguasaannya.
        </p>
      )}
    </div>
  )
}
