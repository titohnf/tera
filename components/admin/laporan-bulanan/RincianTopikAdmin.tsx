import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { adalahKodeTopik } from '@/lib/belajar/topik-rapor'
import RincianGrup from '@/app/keluarga/[studentId]/penguasaan/[kunci]/RincianGrup'
import RincianMisi from '@/app/keluarga/[studentId]/penguasaan/[kunci]/RincianMisi'

/**
 * Rincian satu topik seorang siswa, dilihat admin — isinya komponen yang sama
 * dengan halaman rincian di portal keluarga (`RincianGrup`, `RincianMisi`),
 * jadi angka, paket, dan jawaban per soalnya tidak bisa berbeda dengan yang
 * dibaca orang tua.
 *
 * Yang dicabut untuk admin cuma tombol yang MEMULAI latihan atas nama siswa.
 * Soal per jawaban dibuka di `./soal`, dengan kunci jawaban tampil.
 *
 * `dari` menentukan menu asal (Latihan Mandiri atau Ketuntasan Materi) dan
 * dengan itu ke mana panah kembali. Dua rute memakainya: `/admin/rekap-penguasaan/[studentId]/[kunci]`
 * dan `/admin/misi/[studentId]/[kunci]`, supaya menu samping menyala di menu asal. Dua lapisan, satu alamat — sama seperti di
 * portal keluarga: `kunci` yang berbentuk kode topik (mis. `D-01`) adalah topik
 * Misi, selainnya id grup kurikulum.
 */
export default async function RincianTopikAdmin({
  studentId,
  kunci,
  dari,
}: {
  studentId: string
  kunci: string
  dari: 'mandiri' | 'misi'
}) {
  const { data: siswa } = await createAdminClient()
    .from('profiles')
    .select('full_name, role')
    .eq('id', studentId)
    .in('role', ['student', 'mandiri'])
    .maybeSingle()
  if (!siswa) notFound()

  const menu = dari === 'misi' ? '/admin/misi' : '/admin/rekap-penguasaan'
  const namaMenu = dari === 'misi' ? 'Ketuntasan Materi' : 'Latihan Mandiri'

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-1.5">
        <Link
          href={`${menu}?student_id=${studentId}`}
          aria-label={`Kembali ke ${namaMenu}`}
          title={namaMenu}
          className="-ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rincian Topik</h1>
          <p className="text-sm text-gray-500">
            {(siswa.full_name as string | null) ?? '(tanpa nama)'} · {namaMenu}
          </p>
        </div>
      </div>

      {adalahKodeTopik(kunci) ? (
        <RincianMisi studentId={studentId} topikId={kunci} admin={{ dari }} />
      ) : (
        <RincianGrup studentId={studentId} groupId={kunci} admin={{ dari }} />
      )}
    </div>
  )
}
