import { redirect } from 'next/navigation'

/** Materi kini hanya ada di tampilan siswa; tampilan keluarga memantau. Tautan lama dialihkan ke beranda keluarga. */
export default async function MateriKeluargaLama({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  redirect(`/keluarga/${studentId}`)
}
