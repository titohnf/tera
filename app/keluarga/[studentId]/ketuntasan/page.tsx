import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import IsiKetuntasan from '@/components/keluarga/IsiKetuntasan'

/**
 * Ketuntasan Materi: peta kompetensi seorang anak. Seluruh isinya ada di
 * `IsiKetuntasan`, yang juga dipakai menu Misi di panel admin.
 */
export default async function KetuntasanMateriPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const learnerId = await learnerAnak(studentId)

  return <IsiKetuntasan studentId={studentId} learnerId={learnerId} />
}
