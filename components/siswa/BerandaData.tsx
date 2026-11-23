import KartuAplikasi from '@/components/apps/KartuAplikasi'
import KartuMisiHariIni from '@/components/belajar/misi/KartuMisiHariIni'
import HeroBeranda, { type IsiHero } from '@/components/siswa/HeroBeranda'
import { sesiTertunda } from '@/lib/belajar/sesi'
import { misiAktif } from '@/lib/siswa/misi-aktif'
import type { TryOutTerdekat } from '@/lib/tryout/terdekat'

/**
 * Bagian beranda siswa yang menunggu data: hero dan penanda di baris menu. Tiap
 * komponen di sini ASINKRON dan dibungkus `Suspense` oleh halamannya, sehingga
 * sapaan dan menu tampil seketika dan bagian ini menyusul begitu datanya siap
 * (kueri Misi dan sesi berat — dulu seluruh beranda menunggunya). Datanya datang
 * sebagai promise yang sudah berjalan sejak halaman mulai dirender, jadi tidak
 * ada kueri yang baru dimulai setelah yang lain selesai.
 */

/** Hero: latihan tertunda, lalu Try Out yang sedang dibuka, lalu kartu Misi hari ini. */
export async function HeroSiswa({
  studentId,
  learnerIdP,
  tryOutP,
}: {
  studentId: string
  learnerIdP: Promise<string | null>
  tryOutP: Promise<TryOutTerdekat | null>
}) {
  const learnerId = await learnerIdP
  const [sesi, misi, tryOut] = await Promise.all([
    learnerId ? sesiTertunda(learnerId).catch(() => null) : null,
    learnerId ? misiAktif(studentId, learnerId) : null,
    tryOutP,
  ])

  if (sesi) return <HeroBeranda isi={{ jenis: 'lanjut', sesi }} />
  if (tryOut?.terbuka) {
    return <HeroBeranda isi={{ jenis: 'tryout', label: tryOut.label, teks: tryOut.teks, href: `/siswa/${studentId}/tryout` }} />
  }
  if (misi) {
    return (
      <KartuMisiHariIni
        topik={misi.sekarang}
        langkah={misi.langkah}
        paket={misi.paket}
        anak={studentId}
        hariIni={misi.hariIni}
        adaMateri={misi.adaMateri}
        progres={misi.kemajuan}
      />
    )
  }
  const isi: IsiHero = { jenis: 'misi', href: `/siswa/${studentId}/misi?mapel=Matematika&buka=sekarang`, kemajuan: null }
  return <HeroBeranda isi={isi} />
}

/* Baris menu: dipakai sebagai isi dan sebagai cadangan (tanpa penanda) selagi datanya dimuat. */

export function BarisLatihan({ studentId, lencana }: { studentId: string; lencana?: string }) {
  return (
    <KartuAplikasi
      nama="Latihan Soal"
      teks="Soal per topik dengan pembahasan."
      href={`/belajar?anak=${studentId}`}
      satuBaris
      ikon="memo-bk"
      lencana={lencana}
    />
  )
}

export function BarisMisi({ studentId, lencana }: { studentId: string; lencana?: string }) {
  return (
    <KartuAplikasi
      nama="Misi"
      teks="Naik level, kumpulkan bintangnya."
      href={`/siswa/${studentId}/misi`}
      satuBaris
      ikon="rocket-biru"
      lencana={lencana}
    />
  )
}

export function BarisMateri({ studentId }: { studentId: string }) {
  return <KartuAplikasi nama="Materi" teks="Belajar konsep secara interaktif." href={`/siswa/${studentId}/materi`} satuBaris ikon="layar-360" />
}

export function BarisTryOut({ studentId, tryOut }: { studentId: string; tryOut?: TryOutTerdekat | null }) {
  return (
    <KartuAplikasi
      nama="Try Out"
      keterangan={tryOut?.label}
      teks={tryOut?.teks ?? 'Uji kemampuanmu lewat try out TKA.'}
      href={`/siswa/${studentId}/tryout`}
      satuBaris
      ikon="trophy-bk"
    />
  )
}

export async function BarisLatihanData({ studentId, tugasP }: { studentId: string; tugasP: Promise<number> }) {
  const n = await tugasP
  return <BarisLatihan studentId={studentId} lencana={n > 0 ? `${n} tugas` : undefined} />
}

export async function BarisMisiData({ studentId, retestP }: { studentId: string; retestP: Promise<number> }) {
  const n = await retestP
  return <BarisMisi studentId={studentId} lencana={n > 0 ? `${n} cek ulang` : undefined} />
}

export async function BarisTryOutData({ studentId, tryOutP }: { studentId: string; tryOutP: Promise<TryOutTerdekat | null> }) {
  return <BarisTryOut studentId={studentId} tryOut={await tryOutP} />
}
