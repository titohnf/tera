import { anakOrRedirect } from '@/lib/keluarga'
import IsiTopikMisi from '@/components/belajar/IsiTopikMisi'
import RemahRoti from '@/components/siswa/RemahRoti'

export const metadata = { title: 'Misi' }

/** Satu topik Misi untuk siswa bimbel yang masuk dengan kode; tetap di tampilan siswa. */
export default async function TopikMisiSiswaPage({ params }: { params: Promise<{ studentId: string; topikId: string }> }) {
  const { studentId, topikId } = await params
  await anakOrRedirect(studentId)
  return (
    <div className="space-y-4">
      <RemahRoti item={[{ label: 'Beranda', href: `/siswa/${studentId}` }, { label: 'Misi', href: `/siswa/${studentId}/misi` }, { label: topikId }]} />
      <IsiTopikMisi anak={studentId} topikId={topikId} />
    </div>
  )
}
