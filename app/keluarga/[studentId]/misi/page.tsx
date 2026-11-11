import IsiMisi from '@/components/belajar/IsiMisi'

/** Misi seorang anak keluarga. Isinya di `components/belajar/IsiMisi`. */
export default async function PaketTopikPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  return <IsiMisi anak={studentId} />
}
