import { anakOrRedirect } from '@/lib/keluarga'
import IsiMisi from '@/components/belajar/IsiMisi'
import PilihMisiMapel from '@/components/belajar/PilihMisiMapel'

export const metadata = { title: 'Misi' }

/** Misi untuk siswa bimbel yang masuk dengan kode; isinya sama dengan Misi keluarga (`IsiMisi`), tetapi tetap di tampilan siswa. */
export default async function MisiSiswaPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ mapel?: string; buka?: string }>
}) {
  const { studentId } = await params
  const { mapel, buka } = await searchParams
  await anakOrRedirect(studentId)
  const alamat = (m: string) => `/siswa/${studentId}/misi?mapel=${encodeURIComponent(m)}`
  // Tanpa ?mapel= : pintu masuk berisi kartu per mapel; petanya baru terbuka sesudah mapel dipilih.
  if (!mapel) {
    return (
      <div className="space-y-4">
        <PilihMisiMapel anak={studentId} alamat={alamat} />
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <IsiMisi anak={studentId} pilihMapel={{ dipilih: mapel, alamat }} bukaSekarang={buka === 'sekarang'} />
    </div>
  )
}
