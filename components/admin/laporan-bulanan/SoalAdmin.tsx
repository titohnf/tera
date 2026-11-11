import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { dasarRincianAdmin } from '@/lib/belajar/rincian-konteks'
import TinjauSoalIsi from '@/app/keluarga/[studentId]/penguasaan/[kunci]/soal/TinjauSoalIsi'

/**
 * Satu soal dan jawaban siswa, dilihat admin. Isinya `TinjauSoalIsi`, komponen
 * yang sama dengan rute orang tua; bedanya kunci jawaban selalu tampil dan
 * panah kembali menuju rincian topik di menu asalnya (`dari`).
 */
export default async function SoalAdmin({
  studentId,
  kunci,
  sesiId,
  itemId,
  dari,
}: {
  studentId: string
  kunci: string
  sesiId?: string
  itemId?: string
  dari: 'mandiri' | 'misi'
}) {
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
          href={`${dasarRincianAdmin(dari, studentId)}/${kunci}`}
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

      <TinjauSoalIsi studentId={studentId} kunci={kunci} sesiId={sesiId} itemId={itemId} admin={{ dari }} />
    </div>
  )
}
