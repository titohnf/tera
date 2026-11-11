import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import TabelLatihanSiswa, {
  type BarisLatihan,
  type KolomLatihan,
} from '@/components/admin/laporan-bulanan/TabelLatihanSiswa'
import IsiKetuntasan from '@/components/keluarga/IsiKetuntasan'
import { ringkasanLatihanSemua } from '@/lib/reports/ringkasan-latihan-semua'
import { waktuRelatif } from '@/lib/waktu-relatif'

export const metadata = { title: 'Ketuntasan Materi' }

/**
 * Ketuntasan Materi seorang siswa, dilihat admin — isinya komponen yang sama
 * dengan halaman Ketuntasan Materi di portal keluarga (`IsiKetuntasan`), jadi
 * angka dan urutannya tidak bisa berbeda dengan yang dibaca orang tua.
 *
 * Angkanya datang dari `topik_kemajuan()`, yang gerbangnya `practice_actor()`.
 * Admin baru lolos sejak migrasi 208; sebelum itu daftarnya selalu kosong.
 *
 * Tanpa siswa terpilih, halaman ini tabel semua siswa aktif (satu baris per
 * siswa, angkanya dari fungsi yang sama dengan halaman rapor keluarga —
 * `ringkasanLatihanSemua`); klik baris membuka rincian siswa itu.
 *
 * Kartu topik menaut ke rincian di `/admin/rekap-penguasaan/[studentId]/[kunci]`
 * (`?dari=misi` supaya panah kembali jatuh di menu ini), yang merender komponen
 * rincian portal keluarga untuk admin.
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
    .select('id, full_name, grade, role')
    .in('role', ['student', 'mandiri'])
    .eq('is_active', true)
    .order('full_name')

  const daftarSiswa = (students ?? []) as unknown as {
    id: string
    full_name: string | null
    grade: string | number | null
    role: string
  }[]
  // Pelanggan langganan (role `mandiri`) ikut didaftar: mereka berlatih dan
  // mengerjakan Misi seperti murid bimbel, tapi bukan siswa — diberi penanda.
  const namaDari = (s: { full_name: string | null; role: string }) =>
    `${s.full_name ?? '(tanpa nama)'}${s.role === 'mandiri' ? ' (langganan)' : ''}`
  const options = daftarSiswa.map(s => ({
    value: s.id,
    label: namaDari(s),
  }))

  // Tabel hanya dibangun di tampilan semua siswa.
  let baris: BarisLatihan[] = []
  const kolom: KolomLatihan[] = [
    {
      kunci: 'terakhir',
      label: 'Terakhir',
      lengkap: 'Terakhir membuka sesi latihan atau Misi; yang paling lama tidak berlatih di atas bila diurutkan naik',
    },
    { kunci: 'level', label: 'Level', lengkap: 'Jenjang kelas tertinggi yang seluruh topiknya tuntas' },
    { kunci: 'dikerjakan', label: 'Dikerjakan', lengkap: 'Topik peta kompetensi yang pernah dikerjakan' },
    { kunci: 'tuntas', label: 'Tuntas', lengkap: 'Topik yang paket latihannya tuntas, dari seluruh topik peta' },
  ]
  if (!student_id) {
    const ringkasan = await ringkasanLatihanSemua(daftarSiswa.map(s => s.id))
    baris = daftarSiswa.map(s => {
      const r = ringkasan.get(s.id)
      const k = r?.ketuntasan ?? null
      const sel: BarisLatihan['sel'] = {}
      if (r?.terakhir) {
        const w = waktuRelatif(r.terakhir)
        sel.terakhir = { teks: w.teks, nilai: new Date(r.terakhir).getTime(), judul: w.lengkap }
      }
      if (k && k.dikerjakan > 0) {
        if (k.levelKelas !== null) {
          sel.level = { teks: `Kelas ${k.levelKelas}`, nilai: Number(k.levelKelas) }
        }
        sel.dikerjakan = { teks: `${k.dikerjakan} topik`, nilai: k.dikerjakan }
        sel.tuntas = { teks: `${k.tuntas}/${k.topik}`, nilai: k.tuntas }
      }
      return {
        id: s.id,
        nama: s.full_name ?? '(tanpa nama)',
        jenis: s.role === 'mandiri' ? ('langganan' as const) : ('bimbel' as const),
        kelas: s.grade === null || s.grade === undefined ? null : String(s.grade),
        sel,
      }
    })
  }

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
    <div className={student_id ? 'max-w-2xl' : undefined}>
      <div className="flex items-center gap-1.5">
        {student_id && (
          <Link
            href="/admin/misi"
            aria-label="Kembali ke semua siswa"
            title="Semua siswa"
            className="-ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="text-xl font-semibold text-gray-900">Ketuntasan Materi</h1>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Ketuntasan paket latihan Matematika di menu Misi, sama seperti yang dilihat orang tua.
      </p>

      {student_id ? (
        <>
          <div className="mt-4 mb-6">
            <StudentSelect options={options} value={student_id} />
          </div>
          <IsiKetuntasan
            studentId={student_id}
            learnerId={learnerId as string | null}
            rincian={{ dasar: `/admin/rekap-penguasaan/${student_id}`, sufiks: '?dari=misi' }}
          />
        </>
      ) : (
        <div className="mt-4">
          <TabelLatihanSiswa
            baris={baris}
            kolom={kolom}
            hrefDasar="/admin/misi"
            kataKosong="Level = kelas tertinggi yang seluruh topiknya tuntas. Klik baris untuk melihat rincian per topik."
          />
        </div>
      )}
    </div>
  )
}
