import IsiMisi from '@/components/belajar/IsiMisi'

/**
 * Misi untuk pelanggan langganan (`mandiri`) — tanpa anak. Keluarga bimbel
 * memakai `/keluarga/[studentId]/misi`; keduanya merender `IsiMisi`.
 */
export default function MisiPelangganPage() {
  return <IsiMisi />
}
