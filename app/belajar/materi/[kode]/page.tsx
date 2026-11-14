import IsiMateri from '@/components/belajar/IsiMateri'

/** Materi interaktif satu topik untuk pelanggan langganan. Lihat `components/belajar/IsiMateri`. */
export default async function MateriPelangganPage({
  params,
}: {
  params: Promise<{ kode: string }>
}) {
  const { kode } = await params
  return <IsiMateri kode={kode} />
}
