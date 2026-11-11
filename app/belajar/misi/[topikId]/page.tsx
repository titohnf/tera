import IsiTopikMisi from '@/components/belajar/IsiTopikMisi'

/** Satu topik Misi untuk pelanggan langganan. Lihat `app/belajar/misi/page.tsx`. */
export default async function TopikMisiPelangganPage({
  params,
}: {
  params: Promise<{ topikId: string }>
}) {
  const { topikId } = await params
  return <IsiTopikMisi topikId={topikId} />
}
