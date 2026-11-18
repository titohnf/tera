import { notFound } from 'next/navigation'
import { materiInteraktif } from '@/lib/materi-interaktif'
import PenampilMateri from '@/components/belajar/PenampilMateri'

/**
 * Materi interaktif satu topik Misi, untuk tutor dan admin.
 *
 * Tautan "Buka materi" di jurnal sesi menunjuk ke sini. Rute murid
 * (`/belajar/materi/[kode]`, `/keluarga/<anak>/materi/[kode]`) bekerja atas nama
 * seorang murid dan tidak bisa dibuka tutor. Peran sudah diperiksa oleh
 * `app/tutor/layout.tsx` (tutor atau admin).
 */
export default async function MateriTutorPage({
  params,
}: {
  params: Promise<{ kode: string }>
}) {
  const { kode } = await params
  const materi = materiInteraktif(kode)
  if (!materi) notFound()

  return (
    <PenampilMateri
      html={materi.html}
      judul={`${materi.judul} — ${materi.kode}`}
      hrefLatihan={`/tutor/materi/${materi.kode}`}
    />
  )
}
