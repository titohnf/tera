import { anakOrRedirect } from '@/lib/keluarga'
import TinjauSoalIsi from './TinjauSoalIsi'

/** Satu soal ditinjau orang tua. Isi dan alasan aturannya di `TinjauSoalIsi.tsx`. */
export default async function TinjauSoal({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; kunci: string }>
  searchParams: Promise<{ sesi?: string; item?: string }>
}) {
  const { studentId, kunci } = await params
  const { sesi, item } = await searchParams
  await anakOrRedirect(studentId)

  return <TinjauSoalIsi studentId={studentId} kunci={kunci} sesiId={sesi} itemId={item} />
}
