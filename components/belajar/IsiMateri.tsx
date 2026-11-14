import Link from 'next/link'
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
    <div className="space-y-3">
      <div>
        <Link
          href={alamatMisi(anak, materi.kode)}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Kembali ke topik
        </Link>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">{materi.judul}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{materi.kode} · {materi.ringkas}</p>
      </div>
      <PenampilMateri
        html={materi.html}
        judul={`${materi.judul} — ${materi.kode}`}
        hrefLatihan={alamatMisi(anak, materi.kode)}
      />
    </div>
  )
}
