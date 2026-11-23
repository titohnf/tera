import { notFound } from 'next/navigation'
import { mandiriContext } from '@/lib/mandiri'
import DetailPembahasan from '@/components/tryout/DetailPembahasan'
import { muatDetailAkun } from '@/lib/tryout/hasil-anak'

export const metadata = { title: 'Detail dan Pembahasan Try Out' }
export const dynamic = 'force-dynamic'

/** Akun mandiri (langganan): soal berurutan nomor dengan jawaban, kunci, dan pembahasan. */
export default async function PembahasanTryOutMandiri({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const { user } = await mandiriContext()
  const d = await muatDetailAkun(user.id, quizId)
  if (!d) notFound()
  return (
    <div className="space-y-4">
      <DetailPembahasan data={d.data} attemptId={d.attemptId} nilai={d.nilai} dikirim={d.dikirim} mulai={d.mulai} />
    </div>
  )
}
