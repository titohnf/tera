import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import IsiKetuntasan from '@/components/keluarga/IsiKetuntasan'

/**
 * Ketuntasan Materi: peta kompetensi seorang anak, satu mapel per tampilan (`?mapel=`; tanpa itu mapel
 * pertama, Matematika dulu). Seluruh isinya ada di `IsiKetuntasan`, yang juga dipakai menu Misi di panel
 * admin.
 */
export default async function KetuntasanMateriPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ mapel?: string }>
}) {
  const { studentId } = await params
  const { mapel: dipilih } = await searchParams
  await anakOrRedirect(studentId)

  const learnerId = await learnerAnak(studentId)

  return (
    <IsiKetuntasan
      studentId={studentId}
      learnerId={learnerId}
      pilihMapel={{ dipilih, alamat: (m) => `/keluarga/${studentId}/ketuntasan?mapel=${encodeURIComponent(m)}` }}
    />
  )
}
