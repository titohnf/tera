import { anakOrRedirect } from '@/lib/keluarga'
import IsiMisi from '@/components/belajar/IsiMisi'
import RemahRoti from '@/components/siswa/RemahRoti'

export const metadata = { title: 'Misi' }

/** Misi untuk siswa bimbel yang masuk dengan kode; isinya sama dengan Misi keluarga (`IsiMisi`), tetapi tetap di tampilan siswa. */
export default async function MisiSiswaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  return (
    <div className="space-y-4">
      <RemahRoti item={[{ label: 'Beranda', href: `/siswa/${studentId}` }, { label: 'Misi' }]} />
      <IsiMisi anak={studentId} />
    </div>
  )
}
