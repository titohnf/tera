import { notFound } from 'next/navigation'
import { belajarContext } from '@/lib/belajar/konteks'
import { alamatMisi } from '@/lib/belajar/alamat-misi'
import { materiInteraktif } from '@/lib/materi-interaktif'
import PenampilMateri from '@/components/belajar/PenampilMateri'

/**
 * Langkah "Belajar" sebuah topik Misi: materi interaktifnya.
 *
 * Dirender dua rute: `/keluarga/[studentId]/materi/[kode]` dan
 * `/belajar/materi/[kode]` (pelanggan, `anak` kosong). `belajarContext()` yang
 * memutuskan siapa boleh masuk — anak yang bukan milik keluarga, atau pelanggan
 * tanpa langganan aktif, dialihkan sebelum halaman ini dirender.
 */
export default async function IsiMateri({ anak, kode }: { anak?: string; kode: string }) {
  await belajarContext(anak)

  const materi = materiInteraktif(kode)
  if (!materi) notFound()

  return (
    <PenampilMateri
      html={materi.html}
      judul={`${materi.judul} — ${materi.kode}`}
      hrefLatihan={alamatMisi(anak, materi.kode)}
      hrefKembali={alamatMisi(anak, materi.kode)}
    />
  )
}
