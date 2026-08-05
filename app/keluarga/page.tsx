import Link from 'next/link'
import { redirect } from 'next/navigation'
import { keluargaContext } from '@/lib/keluarga'

export default async function KeluargaHome() {
  const { namaKeluarga, anak } = await keluargaContext()

  // 20 dari 23 keluarga hanya punya satu anak; menyodorkan daftar berisi satu
  // nama ke mereka adalah langkah yang tidak berguna.
  if (anak.length === 1) redirect(`/keluarga/${anak[0].id}`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Halo, {namaKeluarga}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih anak untuk melihat perkembangannya.</p>
      </div>

      {anak.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          Belum ada anak yang tertaut ke akun ini. Hubungi admin Tera.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {anak.map((a) => (
            <Link
              key={a.id}
              href={`/keluarga/${a.id}`}
              className="rounded-xl bg-white p-5 shadow ring-1 ring-gray-900/5 hover:ring-blue-300 transition"
            >
              <p className="font-medium text-gray-900">{a.full_name}</p>
              <p className="text-xs text-gray-400 mt-1">Lihat jadwal, nilai, dan laporan →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
