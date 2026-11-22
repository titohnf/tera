import { anakOrRedirect } from '@/lib/keluarga'
import IsiMateri from '@/components/belajar/IsiMateri'

/** Materi interaktif satu topik untuk siswa bimbel yang masuk dengan kode; tetap di tampilan siswa. */
export default async function MateriSiswaKodePage({ params }: { params: Promise<{ studentId: string; kode: string }> }) {
  const { studentId, kode } = await params
  await anakOrRedirect(studentId)
  return <IsiMateri anak={studentId} kode={kode} dari="siswa" />
}
