import Link from 'next/link'
import { BookOpen, ChevronRight, Pi } from 'lucide-react'
import { belajarContext } from '@/lib/belajar/konteks'
import { petaTopik } from '@/lib/belajar/topik-peta'
import { MAPEL_AWAL, mapelPerTopik } from '@/lib/belajar/mapel-peta'
import { Maskot } from '@/components/belajar/misi/Gambar'

/**
 * Pintu masuk Misi: satu kartu besar per mapel, SEBELUM peta topiknya.
 *
 * Bergaya sama dengan kartu "Misi hari ini" (gradien, lingkaran hiasan, tebing bawah). Matematika
 * terbuka dan memperlihatkan kemajuan anak; mapel yang belum siap tampil sebagai kartu "Segera
 * hadir" yang tidak bisa diketuk, supaya anak tahu mapel itu akan ada tanpa menemui halaman kosong.
 * Pilihan masuk lewat `?mapel=` (lihat `IsiMisi`), jadi tombol kembali peramban membawa anak ke sini.
 *
 * Kemajuan dibaca dari `petaTopik()`; bila gagal dibaca, kartunya tetap tampil tanpa baris kemajuan.
 */
async function kemajuanMatematika(anak?: string): Promise<{ tuntas: number; total: number } | null> {
  // Di luar try: `belajarContext` mengalihkan (redirect) lewat galat khusus yang tidak boleh ditelan.
  const { learnerId } = await belajarContext(anak)
  try {
    const [peta, mapel] = await Promise.all([petaTopik(learnerId), mapelPerTopik()])
    const topik = peta.filter((t) => (mapel.get(t.id) ?? MAPEL_AWAL) === MAPEL_AWAL)
    if (topik.length === 0) return null
    return { tuntas: topik.filter((t) => t.status === 'tuntas').length, total: topik.length }
  } catch {
    return null
  }
}

export default async function PilihMisiMapel({ anak, alamat }: { anak?: string; alamat: (mapel: string) => string }) {
  const kemajuan = await kemajuanMatematika(anak)
  const persen = kemajuan ? Math.round((kemajuan.tuntas / kemajuan.total) * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-500">Mau berpetualang di mata pelajaran apa hari ini?</p>
      </div>

      {/* MATEMATIKA — terbuka */}
      <Link
        href={alamat('Matematika')}
        className="misi-tombol relative block overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          boxShadow: '0 6px 0 #1E3A8A, 0 14px 24px rgba(15,23,42,0.18)',
        }}
      >
        <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" aria-hidden />
        <span className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10" aria-hidden />
        <Maskot ukuran={72} kelas="misi-melayang pointer-events-none absolute right-4 top-4" />

        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg">
            <Pi className="h-8 w-8" strokeWidth={2.5} aria-hidden />
          </span>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight">Misi Matematika</h2>
          <p className="mt-1 max-w-[80%] text-sm font-semibold text-white/80">
            Selesaikan topik demi topik dan kumpulkan semua bintangnya!
          </p>

          {kemajuan && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-xs font-extrabold">
                <span>{kemajuan.tuntas} dari {kemajuan.total} topik tuntas</span>
                <span>{persen}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.max(persen, kemajuan.tuntas > 0 ? 4 : 0)}%` }} />
              </div>
            </div>
          )}

          <span
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white px-5 py-3.5 text-lg font-extrabold text-blue-700"
            style={{ boxShadow: '0 5px 0 rgba(15,23,42,0.28)' }}
          >
            Mulai Misi
            <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden />
          </span>
        </div>
      </Link>

      {/* BAHASA INDONESIA — segera hadir */}
      <div
        aria-disabled
        className="relative overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
          boxShadow: '0 6px 0 #5B21B6, 0 14px 24px rgba(15,23,42,0.12)',
          filter: 'saturate(0.7)',
        }}
      >
        <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" aria-hidden />
        <span className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10" aria-hidden />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-violet-700 shadow-lg">
              <BookOpen className="h-8 w-8" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">Segera hadir</span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight">Misi Bahasa Indonesia</h2>
          <p className="mt-1 text-sm font-semibold text-white/80">
            Petualangan membaca dan bercerita sedang disiapkan. Tunggu ya!
          </p>
        </div>
      </div>
    </div>
  )
}
