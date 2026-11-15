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
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{materi.judul}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{materi.kode} · {materi.ringkas}</p>
      </div>
      <PenampilMateri
        html={materi.html}
        judul={`${materi.judul} — ${materi.kode}`}
        hrefLatihan={`/tutor/materi/${materi.kode}`}
      />
    </div>
  )
}
