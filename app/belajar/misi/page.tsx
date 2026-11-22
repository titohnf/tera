import IsiMisi from '@/components/belajar/IsiMisi'

/**
 * Misi untuk pelanggan langganan (`mandiri`) — tanpa anak. Keluarga bimbel
 * memakai `/keluarga/[studentId]/misi`; keduanya merender `IsiMisi`.
 */
export default async function MisiPelangganPage({ searchParams }: { searchParams: Promise<{ mapel?: string }> }) {
  const { mapel } = await searchParams
  return <IsiMisi pilihMapel={{ dipilih: mapel, alamat: (m) => `/belajar/misi?mapel=${encodeURIComponent(m)}` }} />
}
