import RincianTopikAdmin from '@/components/admin/laporan-bulanan/RincianTopikAdmin'

export const metadata = { title: 'Rincian Topik' }

/** Rincian satu topik seorang siswa untuk admin. Isinya di `RincianTopikAdmin`. */
export default async function RincianAdminPage({
  params,
}: {
  params: Promise<{ studentId: string; kunci: string }>
}) {
  const { studentId, kunci } = await params
  return <RincianTopikAdmin studentId={studentId} kunci={kunci} dari="mandiri" />
}
