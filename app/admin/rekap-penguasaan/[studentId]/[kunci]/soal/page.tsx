import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server-admin'
import TinjauSoalIsi from '@/app/keluarga/[studentId]/penguasaan/[kunci]/soal/TinjauSoalIsi'

export const metadata = { title: 'Soal' }

/**
 * Satu soal dan jawaban siswa, dilihat admin. Isinya `TinjauSoalIsi`, komponen
 * yang sama dengan rute orang tua; bedanya kunci jawaban selalu tampil dan
 * panah kembali menuju rincian topik di panel admin.
 */
export default async function SoalAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; kunci: string }>
  searchParams: Promise<{ sesi?: string; item?: string; dari?: string }>
}) {
  const { studentId, kunci } = await params
  const { sesi, item, dari: dariRaw } = await searchParams
  const dari = dariRaw === 'misi' ? 'misi' : 'mandiri'

  const { data: siswa } = await createAdminClient()
    .from('profiles')
    .select('id')
    .eq('id', studentId)
    .in('role', ['student', 'mandiri'])
    .maybeSingle()
  if (!siswa) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-1.5">
        <Link
          href={`/admin/rekap-penguasaan/${studentId}/${kunci}?dari=${dari}`}
          aria-label="Kembali ke rincian topik"
          title="Rincian topik"
          className="-ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Soal</h1>
      </div>

      <TinjauSoalIsi studentId={studentId} kunci={kunci} sesiId={sesi} itemId={item} admin={{ dari }} />
    </div>
  )
}
