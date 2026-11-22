import { notFound } from 'next/navigation'
import { alihkanKeTampilanSiswa, umumContext } from '@/lib/umum'
import DetailPembahasan from '@/components/tryout/DetailPembahasan'
import RemahRoti from '@/components/siswa/RemahRoti'
import { muatDetailPesertaKode } from '@/lib/tryout/hasil-anak'

export const metadata = { title: 'Detail dan Pembahasan Try Out' }
export const dynamic = 'force-dynamic'

/** Peserta umum (masuk dengan kode): soal berurutan nomor dengan jawaban, kunci, dan pembahasan. */
export default async function PembahasanTryOutUmum({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const { kode, studentId } = await umumContext()
  await alihkanKeTampilanSiswa(studentId, (id) => `/siswa/${id}/tryout/${quizId}`)
  const d = await muatDetailPesertaKode(kode, quizId)
  if (!d) notFound()
  return (
    <div className="space-y-4">
      <RemahRoti item={[{ label: 'Beranda', href: '/umum' }, { label: 'Try Out', href: '/umum/tryout' }, { label: 'Pembahasan' }]} />
      <DetailPembahasan data={d.data} attemptId={d.attemptId} nilai={d.nilai} dikirim={d.dikirim} mulai={d.mulai} />
    </div>
  )
}
