import { anakOrRedirect } from '@/lib/keluarga'
import { ringkasanSiswa } from '@/lib/siswa/ringkasan'
import TombolKeluar from '@/components/siswa/TombolKeluar'
import Ikon3D from '@/components/ui/Ikon3D'
import { KARTU } from '@/components/ui/desain'

export const metadata = { title: 'Profil' }

/** Tab Profil siswa bimbel yang masuk dengan kode: siapa yang sedang masuk, ringkasan belajarnya, dan tombol Keluar. */
export default async function ProfilSiswaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const { misi, tryOut } = await ringkasanSiswa(studentId)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-kartu">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tera text-xl font-extrabold text-white">
          {anak.nama_pendek.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-extrabold text-slate-900">{anak.full_name}</span>
          <span className="block text-sm font-medium text-slate-500">Siswa Bimbel Tera</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${KARTU} flex flex-col items-center gap-1 p-4 text-center`}>
          <Ikon3D nama="star" ukuran={48} />
          <p className="text-3xl font-extrabold tabular-nums leading-none text-slate-900">
            {misi ? misi.tuntas : '–'}
            {misi && <span className="text-base font-bold text-slate-400"> / {misi.total}</span>}
          </p>
          <p className="text-sm font-semibold text-slate-500">Topik Misi tuntas</p>
        </div>
        <div className={`${KARTU} flex flex-col items-center gap-1 p-4 text-center`}>
          <Ikon3D nama="trophy" ukuran={48} />
          <p className="text-3xl font-extrabold tabular-nums leading-none text-slate-900">{tryOut}</p>
          <p className="text-sm font-semibold text-slate-500">Try out dikerjakan</p>
        </div>
      </div>

      <TombolKeluar className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-kartu transition hover:bg-red-50 disabled:opacity-60" />
    </div>
  )
}
