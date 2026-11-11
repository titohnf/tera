import IsiTopikMisi from '@/components/belajar/IsiTopikMisi'

/** Satu topik Misi seorang anak keluarga. Isinya di `components/belajar/IsiTopikMisi`. */
export default async function TopikMisiPage({
  params,
}: {
  params: Promise<{ studentId: string; topikId: string }>
}) {
  const { studentId, topikId } = await params
  return <IsiTopikMisi anak={studentId} topikId={topikId} />
}
