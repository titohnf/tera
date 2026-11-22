import { redirect } from 'next/navigation'

/** Lihat `../page.tsx`: Misi kini hanya ada di tampilan siswa. */
export default async function TopikMisiKeluargaLama({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  redirect(`/keluarga/${studentId}`)
}
