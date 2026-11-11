import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import TautanLaporanSiswa from '@/components/admin/laporan-bulanan/TautanLaporanSiswa'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import TabelLatihanSiswa, {
  type BarisLatihan,
  type KolomLatihan,
} from '@/components/admin/laporan-bulanan/TabelLatihanSiswa'
import IsiPenguasaan from '@/components/keluarga/IsiPenguasaan'
import { ringkasanLatihanSemua } from '@/lib/reports/ringkasan-latihan-semua'
import { selisihHari, waktuRelatif } from '@/lib/waktu-relatif'
import { nadaPersen, nadaTerakhir } from '@/lib/reports/nada-sel'

export const metadata = { title: 'Latihan Mandiri' }

/**
 * Latihan Mandiri seorang siswa, dilihat admin — komponen yang sama dengan
 * halaman Latihan Mandiri di portal keluarga (`IsiPenguasaan`), jadi angka dan
 * urutannya tidak bisa berbeda dengan yang dibaca orang tua.
 *
 * Angkanya dari `practice_topic_progress()`, yang gerbangnya `practice_actor()`.
 * Admin baru lolos sejak migrasi 208; sebelum itu daftarnya selalu kosong.
 *
 * Kartu topik menaut ke rincian di `/admin/rekap-penguasaan/[studentId]/[kunci]`,
 * yang merender komponen rincian portal keluarga untuk admin.
 *
 * Tidak ada tampilan per kelas di sini. Matriks siswa × topik untuk satu kelas
 * ada di halaman tutor (`/tutor/rekap-penguasaan`); sejak migrasi 209 ia
 * memakai fungsi yang sama dengan halaman ini, jadi angkanya tidak lagi berbeda
 * untuk anak yang sama.
 *
 * Tanpa siswa terpilih, halaman ini tabel semua siswa aktif (satu baris per
 * siswa, angkanya dari fungsi yang sama dengan halaman rapor keluarga —
 * `ringkasanLatihanSemua`); klik baris membuka rincian siswa itu.
 *
 * Hasil Misi tidak termasuk; itu ada di menu Ketuntasan Materi.
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

  // Tabel hanya dibangun di tampilan semua siswa; rincian satu siswa tidak
  // perlu membayar ringkasan seluruh siswa.
  let tabel: { baris: BarisLatihan[]; kolom: KolomLatihan[] } | null = null
  if (!student_id) {
    const ringkasan = await ringkasanLatihanSemua(daftarSiswa.map(s => s.id))

    // Mapel yang paling banyak siswanya berlatih di depan; yang seri urut abjad.
    const jumlahSiswa = new Map<string, number>()
    for (const r of ringkasan.values()) {
      for (const m of r.mandiri?.mapel ?? []) {
        if (m.rataRata !== null) jumlahSiswa.set(m.mapel, (jumlahSiswa.get(m.mapel) ?? 0) + 1)
      }
    }
    const mapel = [...jumlahSiswa.keys()].sort(
      (a, b) => jumlahSiswa.get(b)! - jumlahSiswa.get(a)! || a.localeCompare(b, 'id'),
    )

    const kolom: KolomLatihan[] = [
      {
        kunci: 'terakhir',
        label: 'Terakhir',
        lengkap: 'Terakhir membuka sesi latihan atau Misi; yang paling lama tidak berlatih di atas bila diurutkan naik',
      },
      { kunci: 'dikerjakan', label: 'Dikerjakan', lengkap: 'Topik yang pernah dikerjakan' },
      { kunci: 'selesai', label: 'Selesai', lengkap: 'Topik yang seluruh soalnya sudah dikerjakan' },
      ...mapel.map(m => ({
        kunci: `mapel:${m}`,
        label: m,
        lengkap: `Rata-rata penguasaan topik ${m} yang pernah dikerjakan`,
      })),
    ]

    const baris: BarisLatihan[] = daftarSiswa.map(s => {
      const r = ringkasan.get(s.id)
      const m = r?.mandiri ?? null
      const sel: BarisLatihan['sel'] = {}
      const hari = r?.terakhir ? selisihHari(r.terakhir) : null
      if (r?.terakhir && hari !== null) {
        const w = waktuRelatif(r.terakhir)
        sel.terakhir = {
          teks: w.teks,
          nilai: new Date(r.terakhir).getTime(),
          judul: w.lengkap,
          nada: nadaTerakhir(hari),
        }
      } else {
        sel.terakhir = { teks: 'Belum pernah', nilai: null, nada: 'merah' }
      }
      if (m && m.dikerjakan > 0) {
        sel.dikerjakan = { teks: `${m.dikerjakan} topik`, nilai: m.dikerjakan }
        sel.selesai = { teks: `${m.selesai} topik`, nilai: m.selesai }
        for (const x of m.mapel) {
          if (x.rataRata !== null) sel[`mapel:${x.mapel}`] = {
              teks: `${x.rataRata}%`,
              nilai: x.rataRata,
              nada: nadaPersen(x.rataRata),
            }
        }
      }
      return {
        id: s.id,
        nama: s.full_name ?? '(tanpa nama)',
        jenis: s.role === 'mandiri' ? ('langganan' as const) : ('bimbel' as const),
        hari,
        kelas: s.grade === null || s.grade === undefined ? null : String(s.grade),
        sel,
      }
    })
    tabel = { baris, kolom }
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
            href="/admin/rekap-penguasaan"
            aria-label="Kembali ke semua siswa"
            title="Semua siswa"
            className="-ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="text-xl font-semibold text-gray-900">Latihan Mandiri</h1>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Penguasaan per topik dari soal di menu Belajar, sama seperti yang dilihat orang tua.
      </p>

      {student_id ? (
        <>
          <div className="mt-4">
            <TautanLaporanSiswa
              studentId={student_id}
              aktif="mandiri"
              bimbel={daftarSiswa.find(x => x.id === student_id)?.role !== 'mandiri'}
            />
          </div>
          <div className="mt-3 mb-6">
            <StudentSelect options={options} value={student_id} />
          </div>
          <IsiPenguasaan
            studentId={student_id}
            learnerId={learnerId as string | null}
            rincian={{ dasar: `/admin/rekap-penguasaan/${student_id}` }}
          />
        </>
      ) : (
        <div className="mt-4">
          <TabelLatihanSiswa
            baris={tabel!.baris}
            kolom={tabel!.kolom}
            hrefDasar="/admin/rekap-penguasaan"
            kataKosong="Penguasaan = rata-rata topik yang pernah dikerjakan. Klik baris untuk melihat rincian per topik."
          />
        </div>
      )}
    </div>
  )
}
