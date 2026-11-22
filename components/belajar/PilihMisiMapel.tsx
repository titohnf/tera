import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import IkonMapel from '@/components/belajar/IkonMapel'

/**
 * Pintu masuk Misi: satu kartu per mapel, SEBELUM peta topiknya.
 *
 * Matematika terbuka; mapel lain yang belum siap tampil sebagai kartu "Segera hadir" yang tidak
 * bisa diketuk, supaya anak tahu mapel itu akan ada tanpa menemui halaman kosong. Pilihan masuk
 * lewat `?mapel=` (lihat `IsiMisi`), jadi tombol kembali peramban membawa anak ke sini.
 */
const MAPEL: { nama: string; siap: boolean; keterangan: string }[] = [
  { nama: 'Matematika', siap: true, keterangan: 'Kumpulkan bintang dari topik demi topik' },
  { nama: 'Bahasa Indonesia', siap: false, keterangan: 'Misi bahasa sedang disiapkan' },
]

export default function PilihMisiMapel({ alamat }: { alamat: (mapel: string) => string }) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pilih Misi</h1>
        <p className="mt-0.5 text-sm text-gray-500">Mau berpetualang di mata pelajaran apa hari ini?</p>
      </div>
      <ul className="space-y-3">
        {MAPEL.map((m) => {
          const isi = (
            <>
              <IkonMapel nama={m.nama} />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-gray-900">Misi {m.nama}</span>
                <span className="mt-0.5 block text-sm text-gray-500">{m.keterangan}</span>
              </span>
              {m.siap ? (
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
              ) : (
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">Segera hadir</span>
              )}
            </>
          )
          return (
            <li key={m.nama}>
              {m.siap ? (
                <Link href={alamat(m.nama)} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-kartu transition hover:bg-slate-50">
                  {isi}
                </Link>
              ) : (
                <div aria-disabled className="flex items-center gap-4 rounded-xl bg-white/70 p-4 opacity-75 shadow-kartu">
                  {isi}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
