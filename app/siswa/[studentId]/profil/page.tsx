import { anakOrRedirect } from '@/lib/keluarga'
import TombolKeluar from '@/components/siswa/TombolKeluar'

export const metadata = { title: 'Profil' }

/** Tab Profil siswa bimbel yang masuk dengan kode: siapa yang sedang masuk, dan tombol Keluar. */
export default async function ProfilSiswaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
          {anak.nama_pendek.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold text-gray-900">{anak.full_name}</span>
          <span className="block text-xs text-gray-500">Siswa Bimbel Tera</span>
        </span>
      </div>
      <TombolKeluar className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-kartu transition hover:bg-red-50 disabled:opacity-60" />
    </div>
  )
}
