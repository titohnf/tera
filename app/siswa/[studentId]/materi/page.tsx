import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { alamatMateri } from '@/lib/belajar/alamat-materi'
import { daftarMateriInteraktif } from '@/lib/materi-interaktif'

/** Daftar materi interaktif untuk siswa bimbel yang masuk dengan kode; cermin `app/mandiri/materi`. */
export default async function MateriSiswaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-500 mt-0.5">Belajar dulu, baru berlatih.</p>
      </div>
      <ul className="space-y-2">
        {daftarMateriInteraktif.map((m) => (
          <li key={m.kode}>
            <Link href={alamatMateri(studentId, m.kode)} className="block rounded-xl bg-white p-4 shadow-kartu transition hover:bg-slate-50">
              <span className="block text-xs text-gray-400">{m.kode}</span>
              <span className="block text-base font-semibold tracking-tight text-gray-900">{m.judul}</span>
              <span className="block text-sm text-gray-500">{m.ringkas}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
