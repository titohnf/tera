import { notFound } from 'next/navigation'
import { anakOrRedirect } from '@/lib/keluarga'
import DetailPembahasan from '@/components/tryout/DetailPembahasan'
import { muatDetailAnak } from '@/lib/tryout/hasil-anak'

export const metadata = { title: 'Detail dan Pembahasan Try Out' }
export const dynamic = 'force-dynamic'

/** Untuk siswa yang masuk dengan kode: soal berurutan nomor dengan jawaban, kunci, dan pembahasan. */
export default async function DetailTryOutSiswa({ params }: { params: Promise<{ studentId: string; quizId: string }> }) {
  const { studentId, quizId } = await params
  await anakOrRedirect(studentId)
  const d = await muatDetailAnak(studentId, quizId)
  if (!d) notFound()
  return (
    <div className="space-y-4">
      <DetailPembahasan data={d.data} attemptId={d.attemptId} nilai={d.nilai} dikirim={d.dikirim} mulai={d.mulai} />
    </div>
  )
}
