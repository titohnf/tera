import { anakOrRedirect } from '@/lib/keluarga'
import HeroBeranda, { type IsiHero } from '@/components/siswa/HeroBeranda'
import { learnerAnak, sesiTertunda } from '@/lib/belajar/sesi'
import { kemajuanMisi } from '@/lib/belajar/kemajuan-misi'
import { tryOutTerdekat } from '@/lib/tryout/terdekat'
import KartuAplikasi from '@/components/apps/KartuAplikasi'

/**
 * Beranda siswa bimbel yang masuk dengan kode. Satu elemen berani — hero "apa yang
 * dikerjakan sekarang" — lalu empat pintu yang tenang (sama dengan beranda siswa
 * langganan, `app/mandiri/page.tsx`), semuanya terbuka. Murid bimbel sudah berhak
 * atas seluruh bank soal, jadi tidak ada pintu yang terkunci.
 */
export default async function BerandaSiswa({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const q = `?anak=${studentId}`
  // Pelengkap beranda: gagal apa pun jadi "tidak ada", bukan beranda yang rusak.
  // `learnerAnak` hanya MEMBACA (tidak membuat baris pelajar), jadi aman dipanggil di sini.
  const learnerId = await learnerAnak(studentId).catch(() => null)
  const [sesi, kemajuan, tryOut] = await Promise.all([
    learnerId ? sesiTertunda(learnerId).catch(() => null) : null,
    learnerId ? kemajuanMisi(learnerId) : null,
    tryOutTerdekat(studentId),
  ])

  const hrefTryOut = `/siswa/${studentId}/tryout`
  const hero: IsiHero = sesi
    ? { jenis: 'lanjut', sesi }
    : tryOut?.terbuka
      ? { jenis: 'tryout', label: tryOut.label, teks: tryOut.teks, href: hrefTryOut }
      : { jenis: 'misi', href: `/siswa/${studentId}/misi?mapel=Matematika&buka=sekarang`, kemajuan }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tera text-lg font-extrabold text-white">
          {anak.nama_pendek.charAt(0).toUpperCase()}
        </span>
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">Halo, {anak.nama_pendek}</h1>
      </div>

      <HeroBeranda isi={hero} />

      <div className="space-y-3">
        <KartuAplikasi nama="Latihan Soal" teks="Soal per topik dengan pembahasan." href={`/belajar${q}`} satuBaris ikon="memo-bk" />
        <KartuAplikasi nama="Misi" teks="Naik level, kumpulkan bintangnya." href={`/siswa/${studentId}/misi`} satuBaris ikon="rocket" />
        <KartuAplikasi nama="Materi" teks="Belajar konsep secara interaktif." href={`/siswa/${studentId}/materi`} satuBaris ikon="puzzle-bk" />
        <KartuAplikasi nama="Try Out" keterangan={tryOut?.label} teks={tryOut?.teks ?? 'Uji kemampuanmu lewat try out TKA.'} satuBaris href={hrefTryOut} ikon="trophy-bk" />
      </div>
    </div>
  )
}
