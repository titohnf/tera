import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import IsiPenguasaan from '@/components/keluarga/IsiPenguasaan'

/**
 * Penguasaan per topik untuk satu anak. Seluruh isinya ada di `IsiPenguasaan`,
 * yang juga dipakai menu Rekap Penguasaan di panel admin.
 */
export default async function PenguasaanPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  // `learnerAnak()` cuma MEMBACA — lihat catatannya di `sesi.ts`. Memanggil
  // `belajarContext()` di sini akan melahirkan baris `learners` untuk anak yang
  // halaman penguasaannya kebetulan dibuka, padahal ia belum pernah berlatih.
  const learnerId = await learnerAnak(studentId)

  return <IsiPenguasaan studentId={studentId} learnerId={learnerId} />
}
