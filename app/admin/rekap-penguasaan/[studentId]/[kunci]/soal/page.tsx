import SoalAdmin from '@/components/admin/laporan-bulanan/SoalAdmin'

export const metadata = { title: 'Soal' }

/** Satu soal dan jawaban siswa untuk admin. Isinya di `SoalAdmin`. */
export default async function SoalAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; kunci: string }>
  searchParams: Promise<{ sesi?: string; item?: string }>
}) {
  const { studentId, kunci } = await params
  const { sesi, item } = await searchParams
  return <SoalAdmin studentId={studentId} kunci={kunci} sesiId={sesi} itemId={item} dari="mandiri" />
}
