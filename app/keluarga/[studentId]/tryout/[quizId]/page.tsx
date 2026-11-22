import { notFound } from 'next/navigation'
import { anakOrRedirect } from '@/lib/keluarga'
import DetailPembahasan from '@/components/tryout/DetailPembahasan'
import RemahRoti from '@/components/siswa/RemahRoti'
import { muatDetailAnak } from '@/lib/tryout/hasil-anak'

export const metadata = { title: 'Detail dan Pembahasan Try Out' }
export const dynamic = 'force-dynamic'

/** Soal berurutan nomor dengan jawaban anak, kunci, dan pembahasan; tanpa analisis topik (itu di Laporan Try Out). */
export default async function DetailTryOutKeluarga({ params }: { params: Promise<{ studentId: string; quizId: string }> }) {
  const { studentId, quizId } = await params
  await anakOrRedirect(studentId)
  const d = await muatDetailAnak(studentId, quizId)
  if (!d) notFound()
  return (
    <div className="space-y-4">
      <RemahRoti item={[{ label: 'Try Out', href: `/keluarga/${studentId}/tryout` }, { label: 'Pembahasan' }]} />
      <DetailPembahasan data={d.data} attemptId={d.attemptId} nilai={d.nilai} dikirim={d.dikirim} mulai={d.mulai} />
    </div>
  )
}
