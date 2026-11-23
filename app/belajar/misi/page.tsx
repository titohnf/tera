import IsiMisi from '@/components/belajar/IsiMisi'
import PilihMisiMapel from '@/components/belajar/PilihMisiMapel'

/**
 * Misi untuk pelanggan langganan (`mandiri`) — tanpa anak. Keluarga bimbel
 * memakai `/keluarga/[studentId]/misi`; keduanya merender `IsiMisi`.
 */
export default async function MisiPelangganPage({ searchParams }: { searchParams: Promise<{ mapel?: string; buka?: string }> }) {
  const { mapel, buka } = await searchParams
  const alamat = (m: string) => `/belajar/misi?mapel=${encodeURIComponent(m)}`
  if (!mapel) return <PilihMisiMapel alamat={alamat} />
  return <IsiMisi pilihMapel={{ dipilih: mapel, alamat }} bukaSekarang={buka === 'sekarang'} />
}
