import IsiMateri from '@/components/belajar/IsiMateri'

/** Materi interaktif satu topik untuk seorang anak keluarga. Lihat `components/belajar/IsiMateri`. */
export default async function MateriAnakPage({
  params,
}: {
  params: Promise<{ studentId: string; kode: string }>
}) {
  const { studentId, kode } = await params
  return <IsiMateri anak={studentId} kode={kode} />
}
