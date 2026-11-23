import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Ikon3D from '@/components/ui/Ikon3D'
import { belajarContext } from '@/lib/belajar/konteks'
import { kemajuanMisi } from '@/lib/belajar/kemajuan-misi'
import { warnaMapel } from '@/lib/belajar/warna-mapel'
import { PitaKemajuan, TombolTebing } from '@/components/ui/desain'

/**
 * Pintu masuk Misi: satu kartu per mapel, SEBELUM peta topiknya.
 *
 * Satu elemen berani: kartu mapel yang terbuka, berwarna mapelnya dengan angka
 * kemajuan sebagai bintangnya dan satu tombol bertebing. Tanpa gradien, lingkaran
 * hiasan, atau maskot — yang menarik di sini adalah kemajuannya sendiri. Mapel
 * yang belum siap tampil datar dan redup, supaya anak tahu ia akan ada tanpa
 * menemui halaman kosong. Pilihan masuk lewat `?mapel=` (lihat `IsiMisi`), jadi
 * tombol kembali peramban membawa anak ke sini.
 */
export default async function PilihMisiMapel({ anak, alamat }: { anak?: string; alamat: (mapel: string) => string }) {
  // Di luar try: `belajarContext` mengalihkan (redirect) lewat galat khusus yang tidak boleh ditelan.
  const { learnerId } = await belajarContext(anak)
  const kemajuan = await kemajuanMisi(learnerId)
  const persen = kemajuan ? Math.round((kemajuan.tuntas / kemajuan.total) * 100) : 0
  const warna = warnaMapel('Matematika')

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500">Mau berpetualang di mata pelajaran apa hari ini?</p>

      {/* MATEMATIKA — terbuka */}
      <Link
        href={alamat('Matematika')}
        className="tebing block rounded-2xl p-5 text-white"
        style={{ background: warna.dasar, ['--tebing' as string]: warna.tua } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Ikon3D nama="abacus" ukuran={40} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight">Misi Matematika</h2>
            <p className="text-sm font-medium text-white/80">Selesaikan topik demi topik, kumpulkan bintangnya.</p>
          </div>
        </div>

        {kemajuan && (
          <div className="mt-5">
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tabular-nums leading-none">{kemajuan.tuntas}</span>
              <span className="text-sm font-semibold text-white/80">dari {kemajuan.total} topik tuntas</span>
              <span className="ml-auto text-sm font-bold tabular-nums">{persen}%</span>
            </p>
            <div className="mt-2">
              <PitaKemajuan persen={Math.max(persen, kemajuan.tuntas > 0 ? 4 : 0)} pada="warna" />
            </div>
          </div>
        )}

        <div className="mt-5">
          <TombolTebing varian="putih" tebing={warna.tua} kelas="!text-slate-900">
            Mulai Misi
            <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden />
          </TombolTebing>
        </div>
      </Link>

      {/* BAHASA INDONESIA — segera hadir */}
      <div aria-disabled className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-300 bg-slate-200/60 p-5 text-slate-600">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <Ikon3D nama="open-book" ukuran={40} kelas="opacity-60 grayscale" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold leading-tight text-slate-700">Misi Bahasa Indonesia</h2>
          <p className="text-sm font-medium">Sedang disiapkan. Tunggu ya!</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">Segera hadir</span>
      </div>
    </div>
  )
}
